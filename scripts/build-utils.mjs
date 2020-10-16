import { spawn } from "child_process";
import path from "path";

import fs from "fs-extra"
import archiver from "archiver";
import glob from 'glob';

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

export async function rm(globPattern) {
  console.log(`REMOVE ${globPattern}`);

  const files = await findFiles(globPattern);

  return await Promise.all(
    files.map((file) => fs.remove(file))
  );
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

export async function zip(source, destination, date) {
  console.log(`ZIP ${source} → ${destination}`);

  const files = await findFiles(source + "/**/*.*");

  return await new Promise((resolve, reject) => {
    const output  = fs.createWriteStream(path.resolve(destination));
    const archive = archiver("zip");

    output.on("close", function() {
      resolve();
    });

    archive.on("error", function (error) {
      reject(error);
    });

    archive.pipe(output);

    files.forEach((file) => {
      archive.append(fs.createReadStream(file), { name: path.relative(source, file), date });
    });

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

export function findFiles(globPattern) {
  return new Promise((resolve, reject) => {
    glob(globPattern, (error, matches) => {
      if (error) {
        reject(error);
      } else {
        resolve(matches);
      }
    });
  });
}

export function sourceDateEpoch() {
  const now = new Date();

  if (process.env.SOURCE_DATE_EPOCH) {
    const sourceDate = new Date((process.env.SOURCE_DATE_EPOCH * 1000) + (now.getTimezoneOffset() * 60000));

    console.log(`SOURCE_DATE_EPOCH=${process.env.SOURCE_DATE_EPOCH} # ${sourceDate.toString()}\n`);

    return sourceDate;
  } else {
    console.warn(`SOURCE_DATE_EPOCH not set, using current time ${now.toString()}`);
    console.warn("For a reproducible build, please set the SOURCE_DATE_EPOCH environment variable.");
    console.warn("See https://reproducible-builds.org/docs/source-date-epoch for details.\n");

    return now;
  }
}
