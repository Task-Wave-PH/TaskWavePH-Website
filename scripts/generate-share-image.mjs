// Generates a static brand graphic from original local assets; no credentials or network.
import { createRequire } from "node:module";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import React from "react";
const { ImageResponse } = createRequire(import.meta.url)("next/og");
const root = new URL("../", import.meta.url);
const font = await readFile(
  new URL("public/fonts/poppins/Poppins-SemiBold.ttf", root),
);
const logo = await readFile(
  new URL("public/logo/taskwaveph-logo-transparent.png", root),
);
const h = React.createElement;
const image = new ImageResponse(
  h(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "64px",
        background: "#ffffff",
        color: "#0A1D3B",
        fontFamily: "Poppins",
        borderBottom: "12px solid #0D6EFD",
      },
    },
    h("img", {
      src: `data:image/png;base64,${logo.toString("base64")}`,
      width: 360,
      height: 72,
      style: { objectFit: "cover" },
    }),
    h(
      "div",
      {
        style: {
          display: "flex",
          marginTop: "72px",
          fontSize: 66,
          letterSpacing: "-2px",
        },
      },
      h("span", null, "Outsource. Optimize."),
      h("span", { style: { marginLeft: "16px", color: "#0D6EFD" } }, "Grow."),
    ),
    h(
      "div",
      { style: { marginTop: "24px", fontSize: 30 } },
      "Philippine outsourcing & business support",
    ),
    h(
      "div",
      { style: { marginTop: "auto", fontSize: 24, color: "#526176" } },
      "TaskWavePH | Your Partner in Outsourcing.",
    ),
  ),
  {
    width: 1200,
    height: 630,
    fonts: [{ name: "Poppins", data: font, weight: 600, style: "normal" }],
  },
);
const destination = new URL("public/images/seo/taskwaveph-share.png", root);
await mkdir(new URL("public/images/seo/", root), { recursive: true });
const bytes = Buffer.from(await image.arrayBuffer());
await writeFile(destination, bytes);
console.log(`Created ${fileURLToPath(destination)} (${bytes.length} bytes)`);
