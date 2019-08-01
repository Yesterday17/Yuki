import child_process from "child_process";
import path from "path";
import Git from "../src/git";

// nock.disableNetConnect();

describe("Git", () => {
  const id = 2;

  test("git-init", async (done) => {
    const result = await Git.init();
    expect(result.length).toBe(2);
    done();
  });

  test("git-pr-pull", async (done) => {
    try {
      await Git.pull("repo", `pull/${id}/head:pull/${id}`);
      expect(1).toBe(1);
      done();
    } catch (e) {
      done(e);
    }
  });

  test("git-pr-checkout", async (done) => {
    try {
      await Git.checkout("repo", `pull/${id}`);
      expect(1).toBe(1);
      done();
    } catch (e) {
      done(e);
    }
  });

  test("git-pr-install", (done) => {
    try {
      child_process.execSync(`gitbook install ${path.resolve(".", "repo")}`);
      expect(1).toBe(1);
      done();
    } catch (e) {
      done(e);
    }
  });

  test("git-pr-build", async (done) => {
    try {
      child_process.execSync(
        `gitbook build ${path.resolve(".", "repo")} ${path.resolve(
          ".",
          "build",
          String(id),
        )}`,
      );
      expect(1).toBe(1);
      done();
    } catch (e) {
      done(e);
    }
  });

  test("git-pr-add", async (done) => {
    try {
      await Git.addAll("build");
      expect(1).toBe(1);
      done();
    } catch (e) {
      done(e);
    }
  });

  test("git-pr-commit", async (done) => {
    try {
      await Git.commit(
        "build",
        `feat(pr. ${id}): Updated automatically at timestamp ${Date.now()}`,
      );
      expect(1).toBe(1);
      done();
    } catch (e) {
      done(e);
    }
  });

  test("git-pr-preview-push", async (done) => {
    try {
      await Git.push("build");
      expect(1).toBe(1);
      done();
    } catch (e) {
      done(e);
    }
  });
});
