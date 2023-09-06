#!/usr/bin/env node
import inquirer from "inquirer";
import open from "open";
import fetch from "node-fetch";
import { readFileSync } from "fs";

import ts from "typescript";
const fileName = "applicationTypes.ts"; // Path to your TS file

const sourceFile = await fetchAndProcessFile();

async function fetchAndProcessFile() {
  const fileURL = `https://raw.githubusercontent.com/island-is/island.is/main/libs/application/types/src/lib/ApplicationTypes.ts`;

  const response = await fetch(fileURL);

  if (!response.ok) {
    throw new Error("Failed to fetch file");
  }

  const content = await response.text();
  return ts.createSourceFile(
    "filePath.ts",
    content,
    ts.ScriptTarget.ES2022,
    true
  );
}

const slugs: string[] = [];

function visit(node: ts.Node) {
  if (ts.isPropertyAssignment(node) && node.name.getText() === "slug") {
    const initializer = node.initializer;
    if (ts.isStringLiteral(initializer)) {
      slugs.push(initializer.text);
    }
  }
  ts.forEachChild(node, visit);
}

ts.forEachChild(sourceFile, visit);

function setEnv(env: string) {
  let baseUrl = "http://localhost:4242/umsoknir/";

  if (env === "Production") {
    baseUrl = "https://island.is/umsoknir/";
  } else if (env === "Staging") {
    baseUrl = "https://beta.staging01.devland.is/umsoknir/";
  }
  if (env === "Development") {
    baseUrl = "https://beta.dev01.devland.is/umsoknir/";
  }
  return baseUrl;
}

// Proceed with the inquirer logic as before
(async function promptUser() {
  const answer = await inquirer.prompt([
    {
      type: "list",
      name: "selectedEnv",
      message: "Environment",
      pageSize: 5,
      choices: ["Local", "Development", "Staging", "Production"],
    },
    {
      type: "list",
      name: "selectedSlug",
      message: "Select application",
      pageSize: 20,
      choices: slugs,
    },
  ]);
  const baseUrl = setEnv(answer.selectedEnv);
  const url = `${baseUrl}${answer.selectedSlug}`;
  console.log(`Opening ${url} ...`);
  open(url);
})();
