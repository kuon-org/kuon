export class PlantUMLController {
    constructor(service) {
        this.service = service;
        this.postPlantUMLImage = async (req, res) => {
            try {
                const { format } = req.params;
                let diagram = normalizePlantUML(req.body);
                if (!["svg", "png"].includes(String(format))) {
                    return res.status(400).send("invalid format");
                }
                if (!diagram) {
                    return res.status(400).send("diagram required");
                }
                const { buffer, contentType } = await this.service.renderPlantUML(String(format), diagram);
                res.set("Content-Type", contentType);
                res.send(buffer);
            }
            catch (e) {
                console.error(e);
                res.status(500).send("PlantUML render failed");
            }
        };
    }
}
function normalizePlantUML(input) {
    return (input
        .replace(/^\uFEFF/, "") // BOM除去
        .replace(/\r\n?/g, "\n") // CRLF / CR → LF
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "") // 制御文字除去
        .trimEnd() + "\n"); // 末尾改行保証
}
