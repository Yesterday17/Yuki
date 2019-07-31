import { Context } from "probot";

export async function commentIssue(context: Context, message: string) {
  const issueComment = context.issue({
    body: message,
  });
  await context.github.issues.createComment(issueComment);
}

export async function closeIssue(context: Context) {
  const params = {
    owner: context.payload.repository.owner.login,
    repo: context.payload.repository.name,
    number: context.payload.issue.number,
  };

  await context.github.issues.update({ ...params, state: "closed" });
}

export async function addLabel(context: Context, tag: string) {
  await context.github.issues.addLabels(context.issue({ labels: [tag] }));
}

export async function addLabels(context: Context, tags: string[]) {
  await context.github.issues.addLabels(context.issue({ labels: tags }));
}

export function isSuperUser(user: string) {
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

  return superUsers.includes(user);
}
