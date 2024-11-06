// const kv = await Deno.openKv();
"use server";

import "jsr:@std/dotenv/load";
import { neon } from "@neon/serverless";

// Get the connection string from the environment variable "DATABASE_URL"
const databaseUrl: string = Deno.env.get("DATABASE_URL")!;

// console.log(databaseUrl);

// Create a SQL query executor
const sql = neon(databaseUrl);

Deno.serve(async (request: Request) => {
  // Create short links
  if (request.method == "POST") {
    const body = await request.text();
    const { name, slug, url } = JSON.parse(body);

    if(!name || !slug || !url) {
      return new Response("Please provide name, slug, and url.", { status: 400 });
    }

    // const result = await kv.set(["links", slug], url);

    const result =
      await sql`INSERT INTO links (name, slug, link_ori) VALUES (${name}, ${slug}, ${url})`;

    return new Response(JSON.stringify(result));
  }

  // Redirect short links
  const slug = request.url.split("/").pop() || "";
  //   const url = (await kv.get(["links", slug])).value as string;
  const response = (await sql`SELECT link_ori FROM links WHERE slug = ${slug}`);
  const url = response[0].link_ori;
  if (url) {
    return Response.redirect(url, 301);
  } else {
    const m = !slug ? "Please provide a slug." : `Slug "${slug}" not found`;
    return new Response(m, { status: 404 });
  }
});
