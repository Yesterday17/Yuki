import { Context } from "probot";

export async function closeIssue(context: Context) {
  const params = {
    owner: context.payload.repository.owner.login,
    repo: context.payload.repository.name,
    number: context.payload.issue.number,
  };

  // context.github.issues;
}
