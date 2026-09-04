import net, { type Socket } from "node:net";
import tls, { type TLSSocket } from "node:tls";
import { eventLogger } from "./eventLogger.js";
import { smtpSettingsService, type SmtpSettings } from "./smtpSettingsService.js";

type MailSocket = Socket | TLSSocket;

export type SendMailInput = {
  to: string;
  subject: string;
  text: string;
};

type SmtpResponse = {
  code: number;
  text: string;
};

const SMTP_TIMEOUT_MS = 15_000;

const waitForResponse = (socket: MailSocket): Promise<SmtpResponse> =>
  new Promise((resolve, reject) => {
    let buffer = "";

    const cleanup = () => {
      socket.off("data", onData);
      socket.off("error", onError);
      socket.off("timeout", onTimeout);
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };
    const onTimeout = () => {
      cleanup();
      reject(new Error("SMTPサーバとの通信がタイムアウトしました"));
    };
    const onData = (chunk: Buffer) => {
      buffer += chunk.toString("utf8");
      const lines = buffer.split(/\r?\n/).filter(Boolean);
      const last = lines[lines.length - 1];
      const match = last?.match(/^(\d{3})\s/);
      if (!match) return;

      cleanup();
      resolve({ code: Number(match[1]), text: lines.join("\n") });
    };

    socket.on("data", onData);
    socket.once("error", onError);
    socket.once("timeout", onTimeout);
  });

const command = async (socket: MailSocket, value: string): Promise<SmtpResponse> => {
  const responsePromise = waitForResponse(socket);
  socket.write(`${value}\r\n`);
  return responsePromise;
};

const expect = (response: SmtpResponse, accepted: number[], action: string) => {
  if (!accepted.includes(response.code)) {
    throw new Error(`SMTP ${action} failed (${response.code})`);
  }
};

const connectPlain = (settings: SmtpSettings): Promise<Socket> =>
  new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: settings.host, port: settings.port });
    socket.setTimeout(SMTP_TIMEOUT_MS);
    socket.once("connect", () => resolve(socket));
    socket.once("error", reject);
  });

const connectTls = (settings: SmtpSettings): Promise<TLSSocket> =>
  new Promise((resolve, reject) => {
    const socket = tls.connect({
      host: settings.host,
      port: settings.port,
      servername: settings.host,
    });
    socket.setTimeout(SMTP_TIMEOUT_MS);
    socket.once("secureConnect", () => resolve(socket));
    socket.once("error", reject);
  });

const upgradeToTls = (socket: Socket, settings: SmtpSettings): Promise<TLSSocket> =>
  new Promise((resolve, reject) => {
    socket.setTimeout(0);
    const secureSocket = tls.connect({
      socket,
      servername: settings.host,
    });
    secureSocket.setTimeout(SMTP_TIMEOUT_MS);
    secureSocket.once("secureConnect", () => resolve(secureSocket));
    secureSocket.once("error", reject);
  });

const encodeHeader = (value: string) =>
  /^[\x20-\x7E]*$/.test(value)
    ? value
    : `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;

const escapeAddress = (value: string) => value.replace(/[\r\n<>]/g, "").trim();

const buildMessage = (
  settings: SmtpSettings,
  input: SendMailInput,
): string => {
  const fromAddress = escapeAddress(settings.fromAddress);
  const fromName = encodeHeader(settings.fromName.replace(/[\r\n]/g, "").trim());
  const to = escapeAddress(input.to);
  const subject = encodeHeader(input.subject.replace(/[\r\n]/g, " "));
  const body = input.text.replace(/\r?\n/g, "\r\n").replace(/^\./gm, "..");

  return [
    `From: ${fromName} <${fromAddress}>`,
    `To: <${to}>`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    body,
  ].join("\r\n");
};

export class MailService {
  async isConfigured(): Promise<boolean> {
    return smtpSettingsService.isConfigured();
  }

  async send(input: SendMailInput): Promise<void> {
    const settings = await smtpSettingsService.get();
    if (!(await smtpSettingsService.isConfigured())) {
      throw new Error("SMTPが設定されていません");
    }

    let socket: MailSocket | null = null;
    let transportEncrypted = settings.secure;
    try {
      socket = settings.secure
        ? await connectTls(settings)
        : await connectPlain(settings);

      expect(await waitForResponse(socket), [220], "greeting");
      let ehlo = await command(socket, "EHLO kuon");
      expect(ehlo, [250], "EHLO");

      if (!settings.secure && /STARTTLS/i.test(ehlo.text)) {
        expect(await command(socket, "STARTTLS"), [220], "STARTTLS");
        socket = await upgradeToTls(socket as Socket, settings);
        transportEncrypted = true;
        ehlo = await command(socket, "EHLO kuon");
        expect(ehlo, [250], "EHLO after STARTTLS");
      }

      if (settings.username) {
        if (!transportEncrypted) {
          throw new Error("認証情報を送信するSMTP接続にはTLSが必要です");
        }
        expect(await command(socket, "AUTH LOGIN"), [334], "AUTH LOGIN");
        expect(
          await command(socket, Buffer.from(settings.username).toString("base64")),
          [334],
          "AUTH username",
        );
        expect(
          await command(socket, Buffer.from(settings.password).toString("base64")),
          [235],
          "AUTH password",
        );
      }

      expect(
        await command(socket, `MAIL FROM:<${escapeAddress(settings.fromAddress)}>`),
        [250],
        "MAIL FROM",
      );
      expect(
        await command(socket, `RCPT TO:<${escapeAddress(input.to)}>`),
        [250, 251],
        "RCPT TO",
      );
      expect(await command(socket, "DATA"), [354], "DATA");
      expect(
        await command(socket, `${buildMessage(settings, input)}\r\n.`),
        [250],
        "message delivery",
      );
      await command(socket, "QUIT").catch(() => undefined);
    } catch (error) {
      await eventLogger.error("mail.send.failed", {
        category: "system",
        source: "mail",
        message: "Mail delivery failed",
        metadata: {
          host: settings.host,
          port: settings.port,
          secure: settings.secure,
          error: error instanceof Error ? error.message : "unknown error",
        },
      });
      throw error;
    } finally {
      socket?.destroy();
    }
  }

  async sendTest(to: string): Promise<void> {
    await this.send({
      to,
      subject: "Kuon SMTP test",
      text: "KuonからのSMTPテストメールです。\n\nこのメールを受信できていればSMTP設定は正常です。",
    });
    await eventLogger.info("mail.test.sent", {
      category: "system",
      source: "mail",
      message: "SMTP test mail sent",
      metadata: {},
    });
  }
}

export const mailService = new MailService();
