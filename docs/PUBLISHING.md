# 发布到 GitHub 与插件市场

当前版本：**0.3.0**。安装包：`dsh-inline-edit-0.3.0.tgz`。源码仓库为 [maxy1817/dsh-inline-edit](https://github.com/maxy1817/dsh-inline-edit)。本版让普通文件与文字处于同一编辑流，蓝色原子标签不附加删除 X，支持光标处插入、继续输入、键盘删除与撤销恢复。

本地 334 项自动回归及官方 DSH 0.2.1-rc.5 隔离离线 Web/Host、实际重启恢复、浏览器文件编辑验收已通过，范围见 [验证记录](VALIDATION.md)。每次发布应等待对应 GitHub 检查通过，再发布 Release。历史首次提交 `640d86c` 的 [自动检查记录](https://github.com/maxy1817/dsh-inline-edit/actions/runs/40825170601) 仅代表当时版本。npm 发布与市场收录需分别核实。

## 1. 创建 GitHub 仓库

在 GitHub 右上角选择 **New repository**：

- Repository name：`dsh-inline-edit`。
- Description：`DeepSeek Harness 原生消息编辑插件，支持文字与附件修改，以及分支或当前对话重新生成。`
- 准备公开发布时选择 **Public**。
- 不要勾选自动生成 README、.gitignore 或 License，本地已有这些文件，避免首次推送冲突。

本项目仓库已创建，地址为 `https://github.com/maxy1817/dsh-inline-edit.git`。下面的初始化步骤仅供首次发布参考，已上传后无需重复执行。

## 2. 上传完整源码

在项目文件夹打开 PowerShell，确认目录内有 package.json 和 README.md。初次上传且该文件夹尚未初始化 Git 时执行：

~~~powershell
git init -b main
git add .
git status --short
git diff --cached --stat
git commit -m "Release v0.3.0"
git remote add origin https://github.com/maxy1817/dsh-inline-edit.git
git push -u origin main
~~~

提交前确认列表里没有 node_modules、.env、密钥或私人文件。当前 .gitignore 会排除 node_modules、常见缓存、日志、.env 和所有 .tgz；安装包单独放到 Release。不要使用强制推送来处理远程已有内容。

若 Git 提示缺少作者信息，只设置当前仓库即可：

~~~powershell
git config user.name "你的 GitHub 显示名"
git config user.email "GitHub Settings → Emails 中显示的 noreply 邮箱"
~~~

填写真实值后重新执行 commit 和 push。HTTPS 推送按 Git 的网页登录提示授权，不在代码、README 或聊天中粘贴令牌。

需要保留的源码资料：src、tests、scripts、lib、assets、docs、.github、package.json、package-lock.json、cordis.patch.yml、README.md、README.en.md、CHANGELOG.md、LICENSE、THIRD_PARTY_NOTICES.md、.gitignore、.gitattributes。不要只上传 .tgz 或只上传 lib。

在仓库首页 **About → 设置图标 → Topics** 中添加 `dsh-plugin`、`deepseek-harness`，可再添加 `message-editing`。

## 3. 等待自动检查

仓库的 Actions → Check 会在 Ubuntu、Windows 上使用 Node.js 24 执行安装、构建、测试、产物差异检查和打包预检。两个作业都通过后再发布正式 Release。本地通过不能代替远程 CI 已通过。

需要手动复核发布提交时，可在 Actions → Check → Run workflow 中选择对应分支。发布应使用目标提交实际通过的检查记录。

必须保留 .gitattributes 的 `src/style.css text eol=crlf` 规则：当前 CSS 通过文本加载器内嵌进 JavaScript，换行变化会导致 lib/client.js 与 CI 重新构建的结果不同。该规则解决检出差异，不改动代码逻辑。

package.json 声明的 engines.dsh 范围为 `>=0.2.1-rc.3 <0.2.3-0`。rc.3 是历史契约基线，0.3.0 已完成上述 rc.5 隔离离线 Web/Host 验证，发布前另确认桌面实测通过；当前安装的 DSH 版本为 0.2.2-rc.1。这不代表范围内所有版本均已验收。设置模块的 rc.5 开发依赖用于其故障回归，不应仅为形式统一或通过安装而调整开发依赖。升级宿主后先在隔离配置重测。

## 4. 创建可下载安装的 Release

仓库首页选择 **Releases → Draft a new release**：

- Tag：`v0.3.0`，目标选择 main 上刚通过 CI 的提交。
- Release title：`dsh-inline-edit v0.3.0`。
- 说明可根据 CHANGELOG.md 的 0.3.0 条目填写，并保留实际验收范围。
- 把 `dsh-inline-edit-0.3.0.tgz` 拖到附件区域。

核对版本和附件后再点 **Publish release**。发布前修改了任何打包文件，需要重新运行检查并打包，不要上传陈旧安装包。完整源码仓库的常规命令为：

~~~sh
npm ci
npm run check
npm pack
~~~

npm pack 会再次执行 prepack 检查。预构建 .tgz 不包含开发源码和测试，不应在解压后的分发目录运行上述开发命令。

用户下载 Release 附件后，在所在目录安装：

~~~powershell
dsh plugin --profile desktop add "./dsh-inline-edit-0.3.0.tgz"
~~~

Web 用户把 desktop 改为 web。找不到 dsh 命令时，使用桌面安装目录中 `resources/runtime/cli/bin/dsh.cmd` 的完整路径。安装后重启 DSH。GitHub 自动生成的 Source code.zip/tar.gz 是源码归档，不等同于预构建插件附件。

## 5. 插件市场收录

本插件已通过 [收录 PR #11091](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/11091) 合并到目录。**发布新 Release 不会自动更新目录中固定的安装包地址。** 后续版本需提交同一条目的 tarball 更新，并等待合并及索引刷新。

市场目录参考 [贡献指南](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/main/contributing.md)，本次核对日期为 2026-11-06，要求包括仓库创建满 1 天、真实代码、dsh.bundle manifest 和 dsh-plugin topic。后续提交前仍应重新核对指南。

向 awesome-dsh-plugin/awesome-dsh-plugin 提交 PR，仅更新已有的 `data/plugins/maxy1817__dsh-inline-edit.yml`，不新增重复条目，不手工修改生成的 README 或其他条目。首次收录时才新增该文件。使用 GitHub Release 分发时，模板为：

~~~yaml
url: https://github.com/maxy1817/dsh-inline-edit
name: maxy1817/dsh-inline-edit
category: ui
description:
  en: Edit text and attachments in DeepSeek Harness, with branch or latest-main-message regeneration modes.
  zh: 为 DeepSeek Harness 添加消息和附件编辑，可选择新分支或仅最近主消息的当前对话重新生成。
icon: https://raw.githubusercontent.com/maxy1817/dsh-inline-edit/main/assets/icon-180.png
tarball: https://github.com/maxy1817/dsh-inline-edit/releases/download/v0.3.0/dsh-inline-edit-0.3.0.tgz
~~~

必须先实际发布这个 Release 及附件，再提交带该 tarball 地址的条目。通过维护者审查合并后仍需等待索引刷新；不同市场的收录流程不完全相同。

## 可选：发布 npm

GitHub Release 路线不要求发布 npm。package.json 已填写真实 author、repository、homepage、bugs 信息；如希望用户按包名安装，先检查 npm 包名可用性，再由所有者登录 npm 后执行：

~~~sh
npm publish --access public
~~~

发布成功后才可以使用 `dsh plugin --profile desktop add dsh-inline-edit`。如果包名已被占用，不能只改名字就发布：应使用自己的 scope，并同步核对 manifest、补丁文件、客户端模块 ID、文档与测试。本项目不会替你填写虚构的作者或仓库地址。
