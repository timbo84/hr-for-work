import { Providers } from './providers';
import './globals.css';

const countyName = process.env.NEXT_PUBLIC_COUNTY_NAME || 'County';

export const metadata = {
  title: `${countyName} HR Portal`,
  description: 'Employee Self-Service Portal',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}