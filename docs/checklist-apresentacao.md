# Checklist de Apresentacao

## Antes da apresentacao

- [ ] Liberar as portas `3000`, `3001`, `5433`, `8080` e `9090`
- [ ] Rodar `npm run build` em `frontend/medsync-web`
- [ ] Rodar `docker compose config`
- [ ] Subir o stack local com `docker compose up --build`
- [ ] Verificar frontend em `http://localhost:3000`
- [ ] Verificar login com `admin@medsync.com / admin123`
- [ ] Verificar Prometheus em `http://localhost:9090`
- [ ] Verificar Grafana em `http://localhost:3001`
- [ ] Verificar que notificacoes estao funcionando
- [ ] Separar prints de reserva
- [ ] Deixar abertos os documentos:
  - `docs/entrega-final.md`
  - `docs/arquitetura-final.md`
  - `docs/roteiro-demo.md`
  - `docs/roteiro-video.md`

## Durante a apresentacao

- [ ] Explicar rapidamente a arquitetura
- [ ] Mostrar o frontend
- [ ] Fazer login
- [ ] Criar ou abrir um paciente
- [ ] Criar uma triagem
- [ ] Mostrar a notificacao gerada
- [ ] Mostrar Prometheus
- [ ] Mostrar Grafana
- [ ] Mostrar a estrutura Kubernetes
- [ ] Mostrar os workflows de CI/CD
- [ ] Mostrar os scripts de k6
- [ ] Citar os resultados reais do smoke test

## Plano B

- [ ] Usar prints da interface e do Grafana
- [ ] Usar `docs/entrega-final.md` como apoio de narrativa
- [ ] Demonstrar `kubectl kustomize` em vez de cluster real
- [ ] Mostrar os resultados documentados do k6
- [ ] Mostrar o JSON do dashboard ou a configuracao do Grafana, se a UI falhar
- [ ] Se a porta `5433` estiver ocupada, parar o container conflitante antes da demo
