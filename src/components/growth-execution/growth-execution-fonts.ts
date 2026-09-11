// The Growth Execution Profile's type stack, self-hosted through next/font the
// same way champion-fonts.ts does for the Hidden Champions skin.
//
// Archivo carries the headings: a grotesk with real weight, which suits a page
// about manufacturers. DM Sans is the body face because it is already the DT
// body face in src/styles/theme.css, so the page and the product read the same.
// IBM Plex Mono is reserved for anything that is data — section numbers, lever
// codes, figures, sources — which is what makes the evidence look measured
// rather than asserted.
//
// next/font only downloads a face when its class is applied, so every page that
// does not render a Growth Execution profile pays nothing for these.

import { Archivo, DM_Sans, IBM_Plex_Mono } from "next/font/google";

const display = Archivo({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  variable: "--gep-display",
});

const body = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--gep-body",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--gep-mono",
});

/** Class list that puts the three --gep-* font variables in scope. */
export const growthExecutionFontVars = `${display.variable} ${body.variable} ${mono.variable}`;
