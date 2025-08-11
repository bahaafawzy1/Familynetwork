import 'express-serve-static-core';

declare module 'http' {
  interface IncomingMessage {
    log: any;
  }
}