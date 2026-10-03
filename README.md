[agustincortesmarcos.com](https://agustincortesmarcos.com/)

Repositorio principal del sitio web agustincortesmarcos, disponible en https://agustincortesmarcos.com.
Este repositorio contiene una copia versionada de los archivos que componen el sitio y se utiliza como referencia histórica antes, durante y después de realizar modificaciones en la web.

Purpose

The repository has been created to preserve the current state of the website and to provide a reliable version history as the site evolves. 
Git commits should represent meaningful changes to the website whenever possible, allowing previous states to be identified, compared and restored if necessary.

Website

Production site: https://agustincortesmarcos.com

Repository structure
The repository reproduces the relevant structure of the website and contains the source files, assets, configuration and other resources required for its maintenance.

Files generated automatically by the development environment, local configuration, credentials, caches and other machine-specific data should not be committed.

Versioning

The main branch represents the reference history of the website.
Before substantial modifications, a specific commit or Git tag should be created so that the previous production state can be recovered unambiguously.

Recommended tag format:
pre-change-YYYY-MM-DD

or, for important production states:

vYYYY.MM.DD

Commit policy

Commits should describe the actual modification performed rather than the files affected.
Examples:

fix: correct navigation on mobile devices
content: update contact information
style: revise homepage typography
feat: add new portfolio section
refactor: reorganize stylesheet structure
chore: update project configuration
For major changes, separate unrelated modifications into different commits whenever practical.

Production snapshots

Important production states should be marked with Git tags before significant redesigns, migrations or structural changes.
This makes it possible to distinguish between ordinary development commits and known states that correspond to a deployed version of the website.

Sensitive information

Passwords, API keys, access tokens, private certificates, database credentials, environment files and other secrets must not be stored in the repository.
Sensitive configuration should be provided through environment variables or an appropriate secrets-management mechanism.

Maintenance

Whenever the production website is changed, the corresponding modification should also be reflected in this repository so that the Git history remains an accurate representation of the site's evolution.

Status

Active website under maintenance and incremental development.
