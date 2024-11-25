import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import "@mantine/notifications/styles.css";
import "@mantine/core/styles.css";
import "./globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased`}>
        <MantineProvider defaultColorScheme="dark">
          <Notifications />
          {children}
        </MantineProvider>
      </body>
      <GoogleAnalytics gaId="G-KR8QB2QBQT" />
    </html>
  );
}
