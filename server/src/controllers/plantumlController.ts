import { PlantUMLService } from "../services/plantumlService.js";
import { AppError, ValidationError } from "../errors/AppError.js";
import { Request, Response } from "express";

export class PlantUMLController {
  constructor(private service: PlantUMLService) {}

  postPlantUMLImage = async (req: Request, res: Response) => {
    const { format } = req.params;
    const diagram = normalizePlantUML(req.body as string);

    const fields: Record<string, string[]> = {};
    if (!["svg", "png"].includes(String(format))) {
      fields.format = ["PLANTUML_FORMAT_INVALID"];
    }
    if (!diagram) {
      fields.diagram = ["PLANTUML_DIAGRAM_REQUIRED"];
    }
    if (Object.keys(fields).length > 0) throw new ValidationError(fields);

    try {
      const { buffer, contentType } = await this.service.renderPlantUML(
        String(format),
        diagram,
      );

      res.set("Content-Type", contentType);
      res.send(buffer);
    } catch (error) {
      console.error("PlantUML render failed", error);
      throw new AppError(502, "PLANTUML_RENDER_FAILED", "PlantUML render failed");
    }
  };
}

function normalizePlantUML(input: string): string {
  return (
    input
      .replace(/^\uFEFF/, "")
      .replace(/\r\n?/g, "\n")
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
      .trimEnd() + "\n"
  );
}
