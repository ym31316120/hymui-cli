export class IgnorableError extends Error {
    constructor(msg?: string) {
        super(msg);
    }
}

export class BuildError extends Error {
    hasBeenLogged = false;
    isFatal = false;

    constructor(error: Error | string) {
        super(error instanceof Error ? error.message : error);
        if (error instanceof Error) {
            this.message = error.message;
            this.stack = error.stack;
            this.name = error.name;
            this.hasBeenLogged = (error as BuildError).hasBeenLogged;
            this.isFatal = (error as BuildError).isFatal;
        }
    }
}
