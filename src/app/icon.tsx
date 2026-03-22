import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#171717",
          borderRadius: "6px",
        }}
      >
        <span
          style={{
            fontFamily: "serif",
            fontStyle: "italic",
            fontSize: "24px",
            fontWeight: 400,
            color: "#fafafa",
            lineHeight: 1,
            marginTop: "-2px",
          }}
        >
          O
        </span>
      </div>
    ),
    {
      ...size,
    }
  );
}
