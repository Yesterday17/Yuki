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
    const config: any[] = []; // ["--depth", 1];

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

  public static repoCheckGenerator(
    dir: string,
    callback: (repo: simplegit.SimpleGit) => any,
  ) {
    const repo = Git.repos.get(dir);
    if (repo) {
      return callback(repo);
    }
    return Promise.reject("Repository not initialized!");
  }

  public static pull = async (dir: string, branch?: string) =>
    Git.repoCheckGenerator(dir, (repo) => repo.pull("origin", branch))

  public static fetch = async (dir: string, ref: string) =>
    Git.repoCheckGenerator(dir, (repo) => repo.fetch("origin", ref))

  public static checkout = async (dir: string, branch: string) =>
    Git.repoCheckGenerator(dir, (repo) => repo.checkout(branch))()

  public static push = async (dir: string) =>
    Git.repoCheckGenerator(dir, (repo) => repo.push())

  public static addAll = async (dir: string) =>
    Git.repoCheckGenerator(dir, (repo) => repo.add("*"))

  public static commit = async (dir: string, message: string) =>
    Git.repoCheckGenerator(dir, (repo) => repo.commit(message, undefined, {}))

  public static branch = async (
    dir: string,
  ): Promise<simplegit.BranchSummary> =>
    Git.repoCheckGenerator(dir, (repo) => repo.branch([]))

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
      // console.error(e);
    }

    Git.prWaitChain.then(async () => {
      let fail: string = "";
      try {
        await Git.init();
        await Git.pull("build");
        const branches = (await Git.branch("repo")).branches;
        if (branches[`pull/${id}`] === undefined) {
          await Git.pull("repo", `pull/${id}/head:pull/${id}`);
        }
        await Git.checkout("repo", `pull/${id}`);
        await Git.pull("repo", `pull/${id}/head`);
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
        fail =
          String(e) !== ""
            ? String(e).substr(0, 130)
            : "Unknown reason, please view the log to see details.";
        console.error(e);
      }

      try {
        await context.github.repos.createStatus({
          ...repo,
          sha,
          context: "Yuki",
          state: fail === "" ? "success" : "failure",
          target_url:
            fail === ""
              ? `https://teamcovertdragon.github.io/Harbinger/${id}/`
              : `https://github.com/TeamCovertDragon/Harbinger/pull/${id}`,
          description:
            fail === ""
              ? `https://teamcovertdragon.github.io/Harbinger/${id}/`
              : fail,
        });
      } catch (e) {
        // console.error(e);
      }
    });
  }
  private static repos: Map<string, simplegit.SimpleGit> = new Map();
  private static prWaitChain = Promise.resolve();
}
