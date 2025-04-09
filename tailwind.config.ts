import type { Config } from "tailwindcss";

export default {
	content: ["./src/**/*.{js,ts,jsx,tsx,mdx,svelte}"],
	theme: {
		extend: {
			colors: {
				main: "var(--main)",
				overlay: "var(--overlay)",
				success: "var(--success)",
				warning: "var(--warning)",
				error: "var(--error)",
				bg: "var(--bg)",
				bw: "var(--bw)",
				blank: "var(--blank)",
				text: "var(--text)",
				mtext: "var(--mtext)",
				border: "var(--border)",
				ring: "var(--ring)",
				ringOffset: "var(--ring-offset)",

				secondaryBlack: "#212121"
			},
			borderRadius: {
				base: "0px"
			},
			boxShadow: {
				shadow: "var(--shadow)"
			},
			translate: {
				boxShadowX: "var(--box-shadow-x)",
				boxShadowY: "var(--box-shadow-y)",
				reverseBoxShadowX: "calc(-1 * var(--box-shadow-x))",
				reverseBoxShadowY: "calc(-1 * var(--box-shadow-y))"
			},
			translateX: {
				boxShadowX: "var(--box-shadow-x)",
				reverseBoxShadowX: "calc(-1 * var(--box-shadow-x))"
			},
			translateY: {
				boxShadowY: "var(--box-shadow-y)",
				reverseBoxShadowY: "calc(-1 * var(--box-shadow-y))"
			},
			fontWeight: {
				base: "500",
				heading: "700"
			}
		}
	},
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	plugins: [require("tailwindcss-animate")]
} satisfies Config;
