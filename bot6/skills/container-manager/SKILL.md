# container-manager

Docker 容器管理工具。用于查看、启动、停止、删除容器，以及镜像管理和容器监控。

## 核心能力

- 容器列表和状态查看
- 容器启动/停止/重启
- 容器日志查看
- 镜像管理
- 容器资源监控
- 快速进入容器
- 批量操作

## 常用命令

### 容器状态查看

```bash
# 查看运行中的容器
docker ps

# 查看所有容器（包括停止的）
docker ps -a

# 查看容器详情
docker inspect <container_name_or_id>

# 查看容器资源使用
docker stats --no-stream

# 查看容器实时资源
docker stats

# 查看容器端口映射
docker port <container_name>
```

### 容器管理

```bash
# 启动容器
docker start <container_name>

# 停止容器
docker stop <container_name>

# 重启容器
docker restart <container_name>

# 删除容器（需先停止）
docker rm <container_name>

# 强制删除运行中的容器
docker rm -f <container_name>

# 查看容器日志
docker logs -f <container_name>

# 查看最近日志
docker logs --tail 100 <container_name>

# 进入容器内部
docker exec -it <container_name> /bin/bash

# 复制文件到/从容器
docker cp <container_name>:/path/in/container /local/path
docker cp /local/path <container_name>:/path/in/container
```

### 镜像管理

```bash
# 列出本地镜像
docker images

# 拉取镜像
docker pull <image_name>

# 删除镜像
docker rmi <image_name>

# 清理未使用的镜像
docker image prune -a

# 查看镜像构建历史
docker history <image_name>
```

### 批量操作

```bash
# 停止所有运行中的容器
docker stop $(docker ps -q)

# 删除所有停止的容器
docker rm $(docker ps -aq)

# 删除所有镜像
docker rmi $(docker images -q)

# 清理所有未使用的数据
docker system prune -a
```

### Docker Compose

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 重启单个服务
docker-compose restart <service_name>
```

## 快速诊断

```bash
# 一键健康检查
echo "=== Docker Health ===" && \
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" && \
echo "" && \
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

## 最佳实践

1. **定期清理**: 定期使用 `docker system prune` 清理未使用的容器、镜像和网络
2. **资源限制**: 生产环境应设置内存和 CPU 限制
3. **日志管理**: 使用日志驱动集中收集日志，避免日志文件过大
4. **安全扫描**: 定期扫描镜像漏洞
5. **命名规范**: 使用有意义的容器名称，便于管理
