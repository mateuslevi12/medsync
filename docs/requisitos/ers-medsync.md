# ERS - MedSync (Especificação de Requisitos de Software)

## 1. Introdução

### 1.1 Finalidade
Este documento define os requisitos funcionais e não funcionais do sistema MedSync, servindo como referência para desenvolvimento, testes e validação da plataforma.

### 1.2 Escopo
O MedSync é uma plataforma distribuída de gestão hospitalar para hospitais e unidades de saúde, com foco em cadastro de usuários e pacientes, prontuário eletrônico, teletriagem e notificações.

## 2. Descrição Geral
O sistema seguirá arquitetura de microserviços, com frontend web e backend distribuído. Os serviços serão desacoplados, escaláveis e integrados por APIs e mensageria para garantir desempenho, disponibilidade e rastreabilidade de eventos clínicos.

## 3. Requisitos Funcionais
- **RF01:** O sistema deve permitir o cadastro de usuários (administrador, profissional de saúde e recepcionista).
- **RF02:** O sistema deve permitir login de usuários autenticados.
- **RF03:** O sistema deve permitir gerenciamento de perfis e permissões de acesso.
- **RF04:** O sistema deve permitir o cadastro de pacientes.
- **RF05:** O sistema deve permitir consulta de pacientes por múltiplos critérios (nome, documento, prontuário).
- **RF06:** O sistema deve permitir atualização de dados cadastrais dos pacientes.
- **RF07:** O sistema deve registrar e consultar histórico de atendimentos do paciente.
- **RF08:** O sistema deve permitir criação e atualização de prontuário eletrônico.
- **RF09:** O sistema deve registrar consultas, exames e medicamentos vinculados ao paciente.
- **RF10:** O sistema deve realizar teletriagem conforme Protocolo de Manchester.
- **RF11:** O sistema deve enviar notificações relacionadas a eventos de atendimento e alertas clínicos.
- **RF12:** O sistema deve permitir localização de pacientes por status e unidade de atendimento.
- **RF13:** O sistema deve disponibilizar informações gerais da unidade de saúde (fluxo, filas e indicadores básicos).

## 4. Requisitos Não Funcionais
- **RNF01:** O sistema deve adotar arquitetura de microserviços.
- **RNF02:** O sistema deve utilizar autenticação baseada em JWT.
- **RNF03:** O sistema deve disponibilizar APIs via REST e gRPC.
- **RNF04:** O sistema deve usar Apache Kafka para comunicação assíncrona.
- **RNF05:** O sistema deve utilizar PostgreSQL e MongoDB como bancos principais.
- **RNF06:** O sistema deve utilizar Redis para cache e otimização de consultas.
- **RNF07:** O ambiente deve ser executável via Docker.
- **RNF08:** O sistema deve ser preparado para orquestração com Kubernetes.
- **RNF09:** O sistema deve permitir monitoramento com Prometheus e Grafana.
- **RNF10:** O sistema deve permitir centralização de logs com ELK.
- **RNF11:** O frontend deve funcionar em navegador moderno (Chrome, Edge, Firefox e Safari em versões recentes).

## 5. Regras de Negócio
- **RN01:** Cada usuário deve possuir perfil de acesso compatível com suas responsabilidades.
- **RN02:** Apenas usuários autenticados podem acessar funcionalidades internas do sistema.
- **RN03:** O cadastro de paciente deve considerar identificador único (CPF ou documento equivalente).
- **RN04:** O prontuário do paciente só pode ser alterado por profissional de saúde autorizado.
- **RN05:** A triagem deve obedecer a prioridade do Protocolo de Manchester (Vermelho > Laranja > Amarelo > Verde > Azul).
- **RN06:** Eventos críticos de triagem devem gerar notificação imediata.
- **RN07:** Registros clínicos devem manter histórico de alterações para auditoria.
- **RN08:** Dados sensíveis de pacientes devem seguir diretrizes de segurança e privacidade.

## 6. Atores
- **Administrador:** gerencia usuários, perfis, parâmetros do sistema e auditoria.
- **Profissional de Saúde:** realiza triagem, registra atendimentos e atualiza prontuários.
- **Recepcionista:** cadastra pacientes, atualiza dados cadastrais e acompanha fluxo de atendimento.

## 7. Casos de Uso
- **UC01:** Cadastrar usuário.
- **UC02:** Autenticar usuário.
- **UC03:** Gerenciar perfis e permissões.
- **UC04:** Cadastrar paciente.
- **UC05:** Consultar paciente.
- **UC06:** Atualizar dados do paciente.
- **UC07:** Localizar paciente por unidade/status.
- **UC08:** Registrar triagem de paciente.
- **UC09:** Classificar risco (Protocolo de Manchester).
- **UC10:** Criar prontuário eletrônico.
- **UC11:** Atualizar prontuário eletrônico.
- **UC12:** Registrar consulta clínica.
- **UC13:** Registrar exames solicitados/resultados.
- **UC14:** Registrar prescrição de medicamentos.
- **UC15:** Enviar notificações clínicas e operacionais.

## 8. Modelo de Dados (Entidades Principais)
- **Usuário:** id, nome, email, senha, perfil, status, dataCriacao.
- **Paciente:** id, nome, documento, dataNascimento, contato, endereco, unidadeAtual.
- **Atendimento:** id, pacienteId, profissionalId, dataHora, tipo, status.
- **Triagem:** id, atendimentoId, classificacaoRisco, sinaisVitais, observacoes, dataHora.
- **Vacina:** id, pacienteId, nomeVacina, dose, dataAplicacao, lote.
- **Prontuário:** id, pacienteId, evolucoes, exames, prescricoes, anexos, ultimaAtualizacao.

## 9. Glossário
- **API Gateway:** ponto único de entrada para os serviços de backend.
- **JWT:** token de autenticação usado para validar sessões de usuários.
- **Microserviço:** serviço independente com responsabilidade de domínio específica.
- **Prontuário Eletrônico:** registro digital do histórico clínico do paciente.
- **Teletriagem:** avaliação remota de risco clínico antes do atendimento presencial.
- **Protocolo de Manchester:** método de classificação de risco por cores.
- **Kafka:** plataforma de mensageria para processamento de eventos.
- **Observabilidade:** capacidade de monitorar métricas, logs e saúde dos serviços.
