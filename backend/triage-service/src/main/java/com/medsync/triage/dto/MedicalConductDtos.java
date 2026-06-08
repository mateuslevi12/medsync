package com.medsync.triage.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class MedicalConductDtos {

    private MedicalConductDtos() {
    }

    public record MedicationConductDto(
            @NotBlank(message = "id do medicamento é obrigatório")
            @Size(max = 80, message = "id do medicamento deve ter no máximo 80 caracteres")
            @Pattern(regexp = "^[^<>]*$", message = "id do medicamento contém caracteres inválidos")
            String id,

            @NotBlank(message = "nome do medicamento é obrigatório")
            @Size(max = 120, message = "medicamento deve ter no máximo 120 caracteres")
            @Pattern(regexp = "^[^<>]*$", message = "medicamento contém caracteres inválidos")
            String medicationName,

            @Size(max = 120, message = "protocolo deve ter no máximo 120 caracteres")
            @Pattern(regexp = "^[^<>]*$", message = "protocolo contém caracteres inválidos")
            String protocol,

            @NotBlank(message = "data para realização do medicamento é obrigatória")
            @Size(max = 40, message = "data para realização do medicamento deve ter no máximo 40 caracteres")
            String scheduledAt,

            @NotBlank(message = "posologia é obrigatória")
            @Size(max = 500, message = "posologia deve ter no máximo 500 caracteres")
            @Pattern(regexp = "^[^<>]*$", message = "posologia contém caracteres inválidos")
            String dosage,

            @Pattern(regexp = "^(NAO_SALVO|SALVO|REALIZADO|SOLICITADO)$", message = "status do medicamento inválido")
            String status,

            @NotBlank(message = "data de criação do medicamento é obrigatória")
            @Size(max = 40, message = "data de criação do medicamento deve ter no máximo 40 caracteres")
            String createdAt
    ) {
    }

    public record ProcedureConductDto(
            @NotBlank(message = "id do procedimento é obrigatório")
            @Size(max = 80, message = "id do procedimento deve ter no máximo 80 caracteres")
            @Pattern(regexp = "^[^<>]*$", message = "id do procedimento contém caracteres inválidos")
            String id,

            @NotBlank(message = "nome do procedimento é obrigatório")
            @Size(max = 120, message = "procedimento deve ter no máximo 120 caracteres")
            @Pattern(regexp = "^[^<>]*$", message = "procedimento contém caracteres inválidos")
            String procedureName,

            @Size(max = 120, message = "protocolo do procedimento deve ter no máximo 120 caracteres")
            @Pattern(regexp = "^[^<>]*$", message = "protocolo do procedimento contém caracteres inválidos")
            String protocol,

            @NotBlank(message = "data para realização do procedimento é obrigatória")
            @Size(max = 40, message = "data para realização do procedimento deve ter no máximo 40 caracteres")
            String scheduledAt,

            @Size(max = 500, message = "observações do procedimento devem ter no máximo 500 caracteres")
            @Pattern(regexp = "^[^<>]*$", message = "observações do procedimento contêm caracteres inválidos")
            String observations,

            @Pattern(regexp = "^(NAO_SALVO|SALVO|REALIZADO|SOLICITADO)$", message = "status do procedimento inválido")
            String status,

            @NotBlank(message = "data de criação do procedimento é obrigatória")
            @Size(max = 40, message = "data de criação do procedimento deve ter no máximo 40 caracteres")
            String createdAt
    ) {
    }

    public record ObservationPrescriptionConductDto(
            @NotBlank(message = "id da observação é obrigatório")
            @Size(max = 80, message = "id da observação deve ter no máximo 80 caracteres")
            @Pattern(regexp = "^[^<>]*$", message = "id da observação contém caracteres inválidos")
            String id,

            @NotBlank(message = "título da observação é obrigatório")
            @Size(max = 120, message = "título da observação deve ter no máximo 120 caracteres")
            @Pattern(regexp = "^[^<>]*$", message = "título da observação contém caracteres inválidos")
            String title,

            @NotBlank(message = "descrição da observação é obrigatória")
            @Size(max = 1000, message = "descrição da observação deve ter no máximo 1000 caracteres")
            @Pattern(regexp = "^[^<>]*$", message = "descrição da observação contém caracteres inválidos")
            String description,

            @Size(max = 120, message = "tempo de observação deve ter no máximo 120 caracteres")
            @Pattern(regexp = "^[^<>]*$", message = "tempo de observação contém caracteres inválidos")
            String observationTime,

            @Pattern(regexp = "^(NAO_SALVO|SALVO|REALIZADO|SOLICITADO)$", message = "status da observação inválido")
            String status,

            @NotBlank(message = "data de criação da observação é obrigatória")
            @Size(max = 40, message = "data de criação da observação deve ter no máximo 40 caracteres")
            String createdAt
    ) {
    }

    public record ExamConductDto(
            @NotBlank(message = "id do exame é obrigatório")
            @Size(max = 80, message = "id do exame deve ter no máximo 80 caracteres")
            @Pattern(regexp = "^[^<>]*$", message = "id do exame contém caracteres inválidos")
            String id,

            @NotBlank(message = "nome do exame é obrigatório")
            @Size(max = 120, message = "exame deve ter no máximo 120 caracteres")
            @Pattern(regexp = "^[^<>]*$", message = "exame contém caracteres inválidos")
            String examName,

            @Size(max = 120, message = "protocolo do exame deve ter no máximo 120 caracteres")
            @Pattern(regexp = "^[^<>]*$", message = "protocolo do exame contém caracteres inválidos")
            String protocol,

            @Size(max = 500, message = "observações do exame devem ter no máximo 500 caracteres")
            @Pattern(regexp = "^[^<>]*$", message = "observações do exame contêm caracteres inválidos")
            String observations,

            @Pattern(regexp = "^(NAO_SALVO|SALVO|REALIZADO|SOLICITADO)$", message = "status do exame inválido")
            String status,

            @NotBlank(message = "data de criação do exame é obrigatória")
            @Size(max = 40, message = "data de criação do exame deve ter no máximo 40 caracteres")
            String createdAt
    ) {
    }

    public record OrientationConductDto(
            @NotBlank(message = "id da orientação é obrigatório")
            @Size(max = 80, message = "id da orientação deve ter no máximo 80 caracteres")
            @Pattern(regexp = "^[^<>]*$", message = "id da orientação contém caracteres inválidos")
            String id,

            @NotBlank(message = "título da orientação é obrigatório")
            @Size(max = 120, message = "título da orientação deve ter no máximo 120 caracteres")
            @Pattern(regexp = "^[^<>]*$", message = "título da orientação contém caracteres inválidos")
            String title,

            @NotBlank(message = "texto da orientação é obrigatório")
            @Size(max = 2000, message = "texto da orientação deve ter no máximo 2000 caracteres")
            @Pattern(regexp = "^[^<>]*$", message = "texto da orientação contém caracteres inválidos")
            String text,

            @Pattern(regexp = "^(NAO_SALVO|SALVO|REALIZADO|SOLICITADO)$", message = "status da orientação inválido")
            String status,

            @NotBlank(message = "data de criação da orientação é obrigatória")
            @Size(max = 40, message = "data de criação da orientação deve ter no máximo 40 caracteres")
            String createdAt
    ) {
    }

    public record CertificateConductDto(
            @NotBlank(message = "id do atestado é obrigatório")
            @Size(max = 80, message = "id do atestado deve ter no máximo 80 caracteres")
            @Pattern(regexp = "^[^<>]*$", message = "id do atestado contém caracteres inválidos")
            String id,

            @NotBlank(message = "data de emissão do atestado é obrigatória")
            @Size(max = 20, message = "data de emissão do atestado deve ter no máximo 20 caracteres")
            String issueDate,

            @NotBlank(message = "data de início do atestado é obrigatória")
            @Size(max = 20, message = "data de início do atestado deve ter no máximo 20 caracteres")
            String startDate,

            @Min(value = 1, message = "quantidade de dias do atestado deve ser maior que zero")
            @Max(value = 365, message = "quantidade de dias do atestado deve ser no máximo 365")
            Integer days,

            @NotBlank(message = "texto do atestado é obrigatório")
            @Size(max = 2000, message = "texto do atestado deve ter no máximo 2000 caracteres")
            @Pattern(regexp = "^[^<>]*$", message = "texto do atestado contém caracteres inválidos")
            String text,

            Boolean includeCidCode,
            Boolean includeCidDescription,

            @Pattern(regexp = "^(NAO_SALVO|SALVO|REALIZADO|SOLICITADO)$", message = "status do atestado inválido")
            String status,

            @NotBlank(message = "data de criação do atestado é obrigatória")
            @Size(max = 40, message = "data de criação do atestado deve ter no máximo 40 caracteres")
            String createdAt
    ) {
    }

    public record DeclarationConductDto(
            @NotBlank(message = "id da declaração é obrigatório")
            @Size(max = 80, message = "id da declaração deve ter no máximo 80 caracteres")
            @Pattern(regexp = "^[^<>]*$", message = "id da declaração contém caracteres inválidos")
            String id,

            @NotBlank(message = "data inicial da declaração é obrigatória")
            @Size(max = 40, message = "data inicial da declaração deve ter no máximo 40 caracteres")
            String startDateTime,

            @NotBlank(message = "data final da declaração é obrigatória")
            @Size(max = 40, message = "data final da declaração deve ter no máximo 40 caracteres")
            String endDateTime,

            @NotBlank(message = "texto da declaração é obrigatório")
            @Size(max = 2000, message = "texto da declaração deve ter no máximo 2000 caracteres")
            @Pattern(regexp = "^[^<>]*$", message = "texto da declaração contém caracteres inválidos")
            String text,

            @Pattern(regexp = "^(NAO_SALVO|SALVO|REALIZADO|SOLICITADO)$", message = "status da declaração inválido")
            String status,

            @NotBlank(message = "data de criação da declaração é obrigatória")
            @Size(max = 40, message = "data de criação da declaração deve ter no máximo 40 caracteres")
            String createdAt
    ) {
    }

    public record RecipeConductDto(
            @NotBlank(message = "id da receita é obrigatório")
            @Size(max = 80, message = "id da receita deve ter no máximo 80 caracteres")
            @Pattern(regexp = "^[^<>]*$", message = "id da receita contém caracteres inválidos")
            String id,

            @Pattern(regexp = "^(PADRAO|LIVRE)$", message = "forma de preenchimento da receita inválida")
            String fillMode,

            @Pattern(regexp = "^(COMUM|ESPECIAL)$", message = "tipo de receita inválido")
            String recipeType,

            @Size(max = 120, message = "receita favorita deve ter no máximo 120 caracteres")
            @Pattern(regexp = "^[^<>]*$", message = "receita favorita contém caracteres inválidos")
            String favoriteName,

            @NotBlank(message = "texto da receita é obrigatório")
            @Size(max = 3000, message = "texto da receita deve ter no máximo 3000 caracteres")
            @Pattern(regexp = "^[^<>]*$", message = "texto da receita contém caracteres inválidos")
            String text,

            Boolean saveAsFavorite,

            @Pattern(regexp = "^(NAO_SALVO|SALVO|REALIZADO|SOLICITADO)$", message = "status da receita inválido")
            String status,

            @NotBlank(message = "data de criação da receita é obrigatória")
            @Size(max = 40, message = "data de criação da receita deve ter no máximo 40 caracteres")
            String createdAt
    ) {
    }
}
