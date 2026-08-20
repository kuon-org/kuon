const PLANTUML_URL = process.env.PLANTUML_URL || "https://www.plantuml.com/plantuml";
export class PlantUMLService {
    async renderPlantUML(format, diagram) {
        const response = await fetch(`${PLANTUML_URL}/${format}`, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
            },
            body: new Uint8Array(Buffer.from(diagram, "utf-8")),
        });
        if (!response.ok) {
            throw new Error("PlantUML fetch failed");
        }
        const buffer = Buffer.from(await response.arrayBuffer());
        const contentType = format === "svg" ? "image/svg+xml" : "image/png";
        return { buffer, contentType };
    }
}
