import 'next-auth';
declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    company?: object;
    companies?: object[];
  }
}
declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    company?: object;
    companies?: object[];
  }
}
