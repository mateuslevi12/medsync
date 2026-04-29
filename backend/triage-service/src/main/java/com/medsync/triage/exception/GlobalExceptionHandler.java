package com.medsync.triage.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(NotFoundException ex, HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, ex.getMessage(), request.getRequestURI(), List.of());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        List<String> details = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(this::toMessage)
                .toList();

        return build(HttpStatus.BAD_REQUEST, "Erro de validação", request.getRequestURI(), details);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleDenied(HttpServletRequest request) {
        return build(HttpStatus.FORBIDDEN, "Acesso negado", request.getRequestURI(), List.of());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex, HttpServletRequest request) {
        return build(HttpStatus.INTERNAL_SERVER_ERROR, ex.getMessage(), request.getRequestURI(), List.of());
    }

    private String toMessage(FieldError error) {
        return traduzirCampo(error.getField()) + ": " + error.getDefaultMessage();
    }

    private ResponseEntity<ErrorResponse> build(HttpStatus status, String message, String path, List<String> details) {
        ErrorResponse body = new ErrorResponse(
                Instant.now(),
                status.value(),
                traduzirStatus(status),
                message,
                path,
                details
        );
        return ResponseEntity.status(status).body(body);
    }

    private String traduzirCampo(String campo) {
        return switch (campo) {
            case "patientId" -> "patientId";
            case "patientNameSnapshot" -> "nomePaciente";
            case "symptoms" -> "sintomas";
            case "bloodPressure" -> "pressaoArterial";
            case "heartRate" -> "frequenciaCardiaca";
            case "respiratoryRate" -> "frequenciaRespiratoria";
            case "temperature" -> "temperatura";
            case "oxygenSaturation" -> "saturacaoOxigenio";
            case "painLevel" -> "nivelDor";
            case "priority" -> "prioridade";
            case "status" -> "status";
            case "notes" -> "observacoes";
            default -> campo;
        };
    }

    private String traduzirStatus(HttpStatus status) {
        return switch (status) {
            case BAD_REQUEST -> "Requisição inválida";
            case FORBIDDEN -> "Acesso negado";
            case NOT_FOUND -> "Não encontrado";
            case INTERNAL_SERVER_ERROR -> "Erro interno do servidor";
            default -> status.getReasonPhrase();
        };
    }
}
