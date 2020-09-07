import { spawn } from "child_process";
import path from "path";

import fs from "fs-extra"
import archiver from "archiver";

export const pkg = JSON.parse(fs.readFileSync("./package.json", 'utf8'));

export function rem(...lines) {
  console.log("\n###");
  if (lines.length) {
    lines.forEach((line) => {
      console.log("# " + line);
    });
  }
  console.log("###");
}

export function cp(source, destination) {
  console.log(`COPY ${source} → ${destination}`);

  return fs.copy(source, destination);
}

export function rm(pathToRemove) {
  console.log(`REMOVE ${pathToRemove}`);

  return fs.remove(pathToRemove);
}

export function exec(command, args = []) {
  console.log(`EXEC ${command}${args.length ? ' ' + args.join(" ") : ''}`);

  return new Promise((resolve, reject) => {
    const child = spawn(command, args);

    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);

    child.on("close", (code) => {
      if (code == 0) {
        resolve();
      } else {
        reject(new Error(`exec(${JSON.stringify(command)}, ${JSON.stringify(args)}) failed with error code ${code}`));
      }
    });
  });
}

export function zip(source, destination) {
  console.log(`ZIP ${source} → ${destination}`);

  return new Promise((resolve, reject) => {
    const output  = fs.createWriteStream(path.resolve(destination));
    const archive = archiver("zip");

    output.on("close", function() {
      resolve();
    });

    archive.on('warning', function (error) {
      reject(error);
    });

    archive.on("error", function(error) {
      reject(error);
    });

    archive.pipe(output);
    archive.directory(source, false);
    archive.finalize();
  });
}

export function replace(filename, from, to) {
  console.log(`REPLACE "${from}" → "${to}" in ${filename}`);

  return new Promise((resolve, reject) => {
    try {
      const data   = fs.readFileSync(path.resolve(filename), 'utf8');
      const result = data.replace(from, to);

      fs.writeFileSync(filename, result);

      resolve();
    } catch (error) {
      reject(error);
    }
  });
}
