# Git Version Control & Branching Workflows

## Summary
Git is a content-addressable directed acyclic graph (DAG) tracking repository snapshots. Understanding plumbing commands, rebase vs merge, and recovery tools guarantees professional engineering velocity.

## Key Concepts
- **Git Object Model**: Commits, Trees, Blobs, and Annotated Tags identified by SHA-1/SHA-256 hashes.
- **Rebase vs Merge**: `git merge` creates a merge commit preserving historical timeline; `git rebase` replays commits on top of base branch producing a clean linear history.
- **Detached HEAD & Reflog**: `git reflog` records all tip updates of branches and HEAD, allowing recovery of accidentally deleted commits.
- **Advanced Tools**: `git bisect` (binary search to identify regression commits), `git cherry-pick`, `git stash`, and submodules.

## Worked Example: Safe Feature Rebase & Interactive Squashing
```bash
# Update local main branch
git checkout main
git pull origin main

# Rebase feature branch on top of latest main
git checkout feature/auth-system
git rebase main

# Interactive rebase to clean up 3 messy WIP commits into 1 atomic commit
git rebase -i HEAD~3
# (Mark first commit as 'pick', subsequent commits as 'squash')

# Force-push safely with lease protection
git push origin feature/auth-system --force-with-lease
```

## Common Interview Questions
1. *What does `--force-with-lease` do that regular `--force` does not?* (It ensures you only overwrite the remote ref if no one else has updated it since your last fetch, preventing accidental overwrite of teammate commits).
2. *What is a Git index / staging area?* (The intermediate staging cache that prepares the exact tree object that will form the next commit snapshot).
3. *How do you recover a commit that was deleted via hard reset?* (Run `git reflog` to identify the orphaned commit hash, then run `git checkout -b recovery-branch <commit-hash>`).

## Documentation & Official Resources
- [Git SCM Official Book](https://git-scm.com/book/en/v2)
