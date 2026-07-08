import "./globals.css";

export const metadata = {
  title: "Performance Hub",
  description: "Performance appraisal and department evaluation dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
