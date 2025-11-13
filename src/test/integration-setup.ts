import { beforeAll, afterEach, afterAll } from "vitest";
import { server } from "./msw-server";

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

// Reset any request handlers that are declared in a test
afterEach(() => server.resetHandlers());

// Clean up after all tests are done
afterAll(() => server.close());
