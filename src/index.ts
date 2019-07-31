import { Application } from "probot";

// SuperUsers can ignore some checks
// such as issue meta check
const superUsers = [
  "3TUSK",
  "SeraphJACK",
  "SihenZhang",
  "Snownee",
  "TartaricAcid",
  "tdiant",
  "TROU2004",
  "Yesterday17",
];

export = (app: Application) => {
  app.on("issues.opened", async (context) => {
    const title: string = context.payload.issue.title;
    const user: string = context.payload.issue.user.login;

    const titleMatch = title.match(/^\[([^\]]+)\]/);
    if (!titleMatch) {
      // invalid title
      const issueComment = context.issue({
        body: "Thanks for opening this issue!",
      });
      await context.github.issues.createComment(issueComment);
      return;
    }

    const meta = titleMatch[1];
    switch (meta) {
      case "New Content Request":
        await context.github.issues.addLabels(
          context.issue({ labels: ["Status: Pending"] }),
        );
        break;
      case "Erratum/Errata":
        await context.github.issues.addLabels(
          context.issue({ labels: ["Status: Pending"] }),
        );
        break;
      default:
        if (!superUsers.includes(user)) {
          // Invalid meta
          await context.github.issues.createComment(
            context.issue({
              body: `Invalid meta: ${meta}, Closing.`,
            }),
          );
          // Close
        }
        break;
    }

    await context.github.issues.addLabels(
      context.issue({ labels: ["Status: Pending"] }),
    );
  });

  app.on("issue_comment", async (context) => {
    app.log(context);
  });

  app.on("pull_request", async (context) => {
    app.log(context);
  });
};
