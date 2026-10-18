function escapeHtml(value: string): string {
	return value.replace(/[&<>"']/g, (character) => {
		const entities: Record<string, string> = {
			"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
		};
		return entities[character];
	});
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const prompt = url.searchParams.get("prompt")?.trim() || "ketamine";
		if (prompt.length > 1000) {
			return new Response("Please keep the topic under 1,001 characters.", { status: 400 });
		}
		const imageUrl = "?format=png&prompt=" + encodeURIComponent(prompt);
		if (
			url.searchParams.get("format") !== "png" &&
			request.headers.get("Accept")?.includes("text/html")
		) {
			return new Response(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Generated image</title>
<style>
body { margin: 0; padding: 16px; background: #111; color: #fff; font-family: system-ui, sans-serif; }
main { max-width: 2048px; margin: auto; }
img { display: block; width: 100%; max-width: 2048px; height: auto; }
form { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
label { flex-basis: 100%; }
input { flex: 1 1 240px; min-width: 0; padding: 12px; font: inherit; }
button { padding: 12px 20px; font: inherit; cursor: pointer; }
a { display: inline-block; margin-bottom: 16px; color: #a9d5ff; }
</style>
</head>
<body>
<main>
<h1>Text to image</h1>
<form method="get">
<label for="prompt">Image topic</label>
<input id="prompt" name="prompt" type="text" maxlength="1000" required
 value="${escapeHtml(prompt)}" placeholder="Describe the image you want">
<button type="submit">Generate image</button>
</form>
<a href="${escapeHtml(imageUrl)}">Open full-resolution PNG (2048 × 2048)</a>
<img src="${escapeHtml(imageUrl)}" width="2048" height="2048" alt="AI-generated image">
</main>
</body>
</html>`, {
				headers: {
					"content-type": "text/html; charset=utf-8",
					"vary": "Accept",
				},
			});
		}

		const inputs = {
			prompt,
			width: 2048,
			height: 2048,
		} satisfies AiTextToImageInput;

		const response =
			await env.AI.run<"@cf/stabilityai/stable-diffusion-xl-base-1.0">(
				"@cf/stabilityai/stable-diffusion-xl-base-1.0",
				inputs,
			);

		return new Response(response, {
			headers: {
				"content-type": "image/png",
				"vary": "Accept",
			},
		});
	},
} satisfies ExportedHandler<Env>;

