# API Docs v1.13.0 Update Report
Time: Mon Apr  6 19:40:44 CEST 2026

## API Routes Found
app/api/a2a/jsonrpc/route.ts
app/api/a2a/queue/route.ts
app/api/a2a/registry/[id]/heartbeat/route.ts
app/api/a2a/registry/[id]/route.ts
app/api/a2a/registry/route.ts
app/api/admin/rate-limit/rules/[id]/route.ts
app/api/admin/rate-limit/rules/route.ts
app/api/admin/rate-limit/statistics/route.ts
app/api/admin/security/blacklist/route.ts
app/api/analytics/export/route.ts
app/api/analytics/metrics/route.ts
app/api/audit/export/route.ts
app/api/audit/logs/[id]/route.ts
app/api/audit/logs/route.ts
app/api/auth/audit-logs/route.ts
app/api/auth/login/route.ts
app/api/auth/logout/route.ts
app/api/auth/me/route.ts
app/api/auth/permissions/route.ts
app/api/auth/refresh/route.ts
app/api/auth/register/route.ts
app/api/auth/token/route.ts
app/api/auth/verify/route.ts
app/api/csp-violation/route.ts
app/api/csrf-token/route.ts
app/api/data/export/route.ts
app/api/data/import/route.ts
app/api/database/health/route.ts
app/api/database/optimize/route.ts
app/api/demo/task-status/route.ts
app/api/export/async/route.ts
app/api/export/jobs/[jobId]/download/route.ts
app/api/export/jobs/[jobId]/route.ts
app/api/export/jobs/route.ts
app/api/export/sync/route.ts
app/api/feedback/[id]/route.ts
app/api/feedback/route.ts
app/api/github/commits/route.ts
app/api/github/issues/route.ts
app/api/health/detailed/route.ts
app/api/health/live/route.ts
app/api/health/ready/route.ts
app/api/health/route.ts
app/api/import/[taskId]/route.ts
app/api/import/preview/route.ts
app/api/import/route.ts
app/api/metrics/performance/route.ts
app/api/metrics/prometheus/route.ts
app/api/monitoring/apm/route.ts
app/api/monitoring/realtime/route.ts
app/api/multimodal/audio/route.ts
app/api/multimodal/image/route.ts
app/api/performance/alerts/route.ts
app/api/performance/clear/route.ts
app/api/performance/metrics/route.ts
app/api/performance/report/route.ts
app/api/projects/route.ts
app/api/rate-limit/route.ts
app/api/ratings/[id]/helpful/route.ts
app/api/ratings/[id]/route.ts
app/api/ratings/route.ts
app/api/rbac/permissions/route.ts
app/api/rbac/roles/[roleId]/permissions/route.ts
app/api/rbac/roles/[roleId]/route.ts
app/api/rbac/roles/route.ts
app/api/rbac/system/route.ts
app/api/rbac/users/[userId]/permissions/route.ts
app/api/rbac/users/[userId]/roles/route.ts
app/api/rca/analyze/[incidentId]/route.ts
app/api/rca/knowledge/route.ts
app/api/rca/propagation/[incidentId]/route.ts
app/api/reports/custom/route.ts
app/api/reports/generate/route.ts
app/api/reports/templates/route.ts
app/api/revalidate/route.ts
app/api/search/autocomplete/route.ts
app/api/search/history/route.ts
app/api/search/route.ts
app/api/search/v2/route.ts
app/api/sentry-test/route.ts
app/api/status/route.ts
app/api/stream/analytics/route.ts
app/api/stream/health/route.ts
app/api/tasks/route.ts
app/api/user/preferences/route.ts
app/api/v1/tenants/accept/route.ts
app/api/v1/tenants/invite/route.ts
app/api/v1/tenants/login/route.ts
app/api/v1/tenants/route.ts
app/api/v1/tenants/switch/route.ts
app/api/v1/tenants/transfer/route.ts
app/api/vitals/route.ts
app/api/web-vitals/route.ts
app/api/workflow/[id]/executions/[execId]/cancel/route.ts
app/api/workflow/[id]/executions/[execId]/route.ts
app/api/workflow/[id]/executions/route.ts
app/api/workflow/[id]/history/route.ts
app/api/workflow/[id]/metrics/route.ts
app/api/workflow/[id]/route.ts
app/api/workflow/[id]/run/route.ts
app/api/workflow/[id]/stream/route.ts
app/api/workflow/[id]/versions/[versionId]/rollback/route.ts
app/api/workflow/[id]/versions/[versionId]/route.ts
app/api/workflow/[id]/versions/compare/route.ts
app/api/workflow/[id]/versions/route.ts
app/api/workflow/[id]/versions/settings/route.ts
app/api/workflow/history/export/route.ts
app/api/workflow/route.ts

## Route Methods
- /stream/analytics: GET(request:NextRequest){
- /stream/health: GET(request:NextRequest){
- /database/optimize: GET(request:NextRequest){
POST(request:NextRequest){
PUT(request:NextRequest){
- /database/health: 
- /multimodal/image: POST(request:NextRequest){
GET(){
- /multimodal/audio: POST(request:NextRequest){
GET(){
- /analytics/export: POST(request:NextRequest){
GET(){
- /analytics/metrics: GET(request:NextRequest){
POST(request:NextRequest){
- /revalidate: POST(request:NextRequest){
GET(request:NextRequest){
- /csp-violation: POST(request:NextRequest){
GET(){
- /sentry-test: GET(request:NextRequest){
- /status: GET(request:Request){
- /feedback/[id]: GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){
DELETE(request:NextRequest,{params}:{params:Promise<{id:string}>}){
- /feedback: GET(request:NextRequest){
POST(request:NextRequest){
GET_FEEDBACK(
PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){
DELETE_FEEDBACK(
- /csrf-token: GET(){
POST(request:Request){
- /workflow/history/export: POST(request:NextRequest){
- /workflow/[id]/executions/[execId]/cancel: POST(
- /workflow/[id]/executions/[execId]: GET(
- /workflow/[id]/executions: GET(
- /workflow/[id]/stream: GET(

## Docs Gap Analysis
Compare above routes with docs/ folder
Done at Mon Apr  6 19:40:45 CEST 2026
