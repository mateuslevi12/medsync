package com.medsync.users.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateUserStatusRequest(
        @NotNull(message = "status é obrigatório")
        Boolean active
) {
}
