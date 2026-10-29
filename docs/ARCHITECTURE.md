# 实现与兼容性

目标版本为 DSH 0.2.1-rc.3。使用已发布 npm 包的公开接口，不修改 DSH 程序或会话文件。

## 消息资格

history.js 从会话事件构建 dsh-inline-edit-latest 投影。首次进入 agent/inbox/spliced 时记录消息是空闲 next-turn 输入还是运行中补充，不因之后的出队或移到新轮次而重新分类。turn/start/end 与普通用户事件识别主消息；视图只传最新主消息序号及被排除消息序号。

前端对补充/steering 消息不显示当前模式编辑按钮，对旧主消息显示禁用说明。后端重新计算资格，不信任客户端分类。设置未加载完成时不使用默认分支方式误提交。

## 同会话提交

1. sessionController.resolveAgent() 恢复目标 Agent，要求空闲且队列为空。
2. runMaintenance() 独占维护阶段；核验尾序号、Agent 身份和目标消息仍在当前 surface。
3. 校验完整文本、原附件、新上传收据和图片能力。异步校验结束前不替换历史。
4. 同步追加 producer-owned user/message，source.kind=dsh-inline-edit，使用公开 surfaceOp: replace 与准确的 sourceEventSeqs，覆盖目标消息起的旧上下文。
5. agent.followup() 提交修改后的普通用户消息，提交上传绑定。会话 ID 不变。

编辑标记包含简短的模型可见上下文说明和恢复信息。非空 user-context 可兼容不接受空用户输入的模型服务，它不是伪造的系统提示词或助手回答。维护阶段不能追加 developer/message：V4 恢复校验要求它属于未关闭的 step，测试覆盖这一反例。

0.2.2 通过 replacement.id 与被编辑消息的 ID 精确追溯版本链。重复编辑时，仍在 surface 上的旧编辑标记也纳入替换，避免旧 replacement 文本留在适配器收到的 source 元数据中；同时合并界面隐藏范围。升级前积累的标记也能沿链处理。独立的后续任务不会误匹配前一轮编辑。分支模式沿同一版本链寻找原始 cutoff，并跳过原输入的队列入场事件。

请求 ID 去重仅作用于原 Session。进程中断后 agent/created 检查该 Session 的编辑标记；尚未进入持久队列的替换消息恢复一次。已经入队、提交或被明确取消的输入不重复发起。分支继承的标记不触发恢复。提交状态不确定时，客户端禁止直接再次发送，要求先刷新。

恢复和重试还要求标记仍在当前 surface，且之后没有新编辑或其他用户输入（包括入队后尚未消费的消息）。用户已开始新任务时，不再补发过时的编辑请求。

## 显示与审计

提示框基于固定版本的 DSH MIT Tooltip 源码，src/vendor/dsh-tooltip.js/.css 保留原有显示、悬停、键盘、点击固定和关闭交互。0.2.5 的信息图标优先采用右下角、双轴 6px 间距；编辑/复制操作优先在左侧，让开同一行时间和相邻控件。独立定位函数处理边缘换位与遮挡。在完整源码仓库安装固定依赖后，scripts/sync-tooltip.mjs 可重建适配文件，不修改宿主。四个角都无安全空位时选择遮挡最少的位置并保持可见，不保证完全不覆盖控件；未固定的提示不拦截指针事件。

构建使用 esbuild 的 text 加载器内嵌 CSS。src/style.css 的换行字符也属于输出字符串的一部分，因此 .gitattributes 对该文件指定 eol=crlf，其他文本仍按 LF 检出。此规则维持已有源码与 lib/client.js 的可重复构建，不修改运行逻辑。不要在没有重建 lib 的情况下删除这条规则或调整 CSS 换行。

日志保留旧内容；模型上下文由 native surface 决定。dsh-inline-edit-history 投影记录被替换范围，Client 通过公开 slots 委托原生 ChatFlow，过滤旧节点和分组。保留宿主 React 与原生组件；自有子槽位递归镜像公开渲染契约，避免重声明原生子槽位所有权。

轨迹和用量统计不删减。原生轮次导航尚未按替换范围过滤，可能指向不再显示的旧轮次。这是界面限制，不影响会话 ID、模型上下文或持久化恢复。

停用插件后原生 transcript 可能重显旧审计内容；核心 surface 替换仍生效。不能把该功能描述为物理删除或隐私擦除。

## 运行边界

Host 仅在已认证 Connection 注册 plan/current/reuse-file 三个路由。附件索引由原消息确认；上传收据属于目标 Agent；客户端不能读取任意文件路径。请求体限量读取，错误返回短代码，不回传私有路径。

分支模式保持 native fork + prompt 链路。当前模式不调用 fork，不增加聊天，也不撤销执行过的命令和文件修改。

安装包使用宿主提供的 dsh-llm、schemastery、zod peer 依赖，不打包 DSH Host 或 React。上游 rc.3 的开发依赖固定了较旧的 zod，npm audit 会报告其集合校验资源耗尽公告；未强制升级宿主依赖。本项目直接开发依赖使用 zod 4.6.6。应随 DSH 升级重新验证，不执行 audit fix --force。
