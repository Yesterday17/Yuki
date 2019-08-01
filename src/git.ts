import child_process from "child_process";
import fs from "fs";
import path from "path";
import { Context } from "probot";
import simplegit from "simple-git/promise";

export default class Git {
  public static async init() {
    return Promise.all([
      Git.clone(
        "build",
        "git@github.com:TeamCovertDragon/Harbinger.git",
        "gh-pages",
      ),
      Git.clone("repo", "git@github.com:TeamCovertDragon/Harbinger.git"),
    ]);
  }

  public static async clone(dir: string, repo: string, branch?: string) {
    const firstRun = !fs.existsSync(path.resolve(".", dir));
    const config = ["--depth", 1];

    if (firstRun) {
      fs.mkdirSync(path.resolve(".", dir));
    }

    if (branch) {
      config.push("--branch", branch);
    }

    const git = simplegit(path.resolve(".", dir));
    Git.repos.set(dir, git);
    return firstRun ? git.clone(repo, path.resolve(".", dir), config) : "";
  }

  public static async pull(dir: string, branch?: string) {
    const repo = Git.repos.get(dir);
    if (repo) {
      return repo.pull("origin", branch);
    }
    return Promise.reject("Repository not initialized!");
  }

  public static async fetch(dir: string, ref: string) {
    const repo = Git.repos.get(dir);
    if (repo) {
      return repo.fetch("origin", ref);
    }
    return Promise.reject("Repository not initialized!");
  }

  public static async checkout(dir: string, branch: string) {
    const repo = Git.repos.get(dir);
    if (repo) {
      return repo.checkout(branch);
    }
    return Promise.reject("Repository not initialized!");
  }

  public static async push(dir: string) {
    const repo = Git.repos.get(dir);
    if (repo) {
      return repo.push("origin", "master", {});
    }
    return Promise.reject("Repository not initialized!");
  }

  public static async addAll(dir: string) {
    const repo = Git.repos.get(dir);
    if (repo) {
      return repo.add("*");
    }
    return Promise.reject("Repository not initialized!");
  }

  public static async commit(dir: string, message: string) {
    const repo = Git.repos.get(dir);
    if (repo) {
      return repo.commit(message, undefined, {});
    }
    return Promise.reject("Repository not initialized!");
  }

  public static async onPullRequestCreated(context: Context) {
    const pr = context.issue();
    const repo = context.repo();
    const { sha } = context.payload.pull_request.head;
    const id = pr.number;

    try {
      await context.github.repos.createStatus({
        ...repo,
        sha,
        context: "Yuki",
        state: "pending",
        description: "Generating preview pages...",
      });
    } catch (e) {
      console.error(e);
    }

    Git.waitChain.then(async () => {
      let fail: string = "";
      try {
        await Git.init();
        await Git.pull("build");
        await Git.pull("repo", `pull/${id}/head:pull/${id}`);
        await Git.checkout("repo", `pull/${id}`);
        child_process.execSync(`gitbook install ${path.resolve(".", "repo")}`);
        child_process.execSync(
          `gitbook build ${path.resolve(".", "repo")} ${path.resolve(
            ".",
            "build",
            String(id),
          )}`,
        );
        await Git.addAll("build");
        await Git.commit(
          "build",
          `feat(pr. ${id}): Updated automatically at timestamp ${Date.now()}`,
        );
        await Git.push("build");
      } catch (e) {
        fail = String(e) !== "" ? String(e).substr(0, 130) : "Unknown Reason";
      }

      try {
        await context.github.repos.createStatus({
          ...repo,
          sha,
          context: "Yuki",
          state: fail === "" ? "success" : "failure",
          description:
            fail === "" ? `https://covertdragon.team/Harbinger/${id}/` : fail,
        });
      } catch (e) {
        console.error(e);
      }
    });
  }
  private static repos: Map<string, simplegit.SimpleGit> = new Map();
  private static waitChain = Promise.resolve();
}
