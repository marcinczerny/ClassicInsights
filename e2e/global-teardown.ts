import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import path from "node:path";
import type { Database } from "../src/db/database.types";

// Load environment variables from .env.test
config({ path: path.resolve(process.cwd(), ".env.test") });

async function globalTeardown() {
  console.log("Starting E2E global teardown...");

  // Get environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_KEY;
  const e2eUsernameId = process.env.E2E_USERNAME_ID;
  console.log("E2E supabaseUrl:", supabaseUrl);

  if (!supabaseUrl || !supabaseAnonKey || !e2eUsernameId) {
    console.error("Missing required environment variables for teardown");
    console.error("Required: SUPABASE_URL, SUPABASE_KEY, E2E_USERNAME_ID");
    console.error("Current values:");
    console.error(`SUPABASE_URL: ${supabaseUrl ? "✓" : "✗"}`);
    console.error(`SUPABASE_KEY: ${supabaseAnonKey ? "✓" : "✗"}`);
    console.error(`E2E_USERNAME_ID: ${e2eUsernameId ? "✓" : "✗"}`);
    process.exit(1);
  }

  // Create Supabase client
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

  try {
    // Authenticate as the E2E test user
    console.log("Authenticating as E2E test user...");
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: process.env.E2E_USERNAME || "",
      password: process.env.E2E_PASSWORD || "",
    });

    if (signInError) {
      console.error("Error signing in:", signInError);
      throw signInError;
    }

    console.log("Successfully authenticated as E2E test user");
    console.log("Cleaning up notes for E2E test user...");
    console.log("Using user ID:", e2eUsernameId);

    // First, let's count how many notes exist for this user
    const { data: existingNotes, error: countError } = await supabase
      .from("notes")
      .select("id, title")
      .eq("user_id", e2eUsernameId);

    if (countError) {
      console.error("Error counting notes:", countError);
    } else {
      console.log(`Found ${existingNotes?.length || 0} notes for E2E user`);
      if (existingNotes && existingNotes.length > 0) {
        console.log(
          "Notes to delete:",
          existingNotes.map((n) => ({ id: n.id, title: n.title }))
        );
      }
    }

    // Delete all notes created by the E2E test user
    const { data: deleteData, error: deleteError } = await supabase
      .from("notes")
      .delete()
      .eq("user_id", e2eUsernameId)
      .select("id, title");

    if (deleteError) {
      console.error("Error deleting notes during teardown:", deleteError);
      throw deleteError;
    }

    console.log(`Successfully deleted ${deleteData?.length || 0} notes from database`);
  } catch (error) {
    console.error("Error during E2E teardown:", error);
    process.exit(1);
  }
}

export default globalTeardown;
