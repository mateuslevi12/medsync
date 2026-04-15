package com.medsync.auth.client;

import com.medsync.auth.dto.InternalUserResponse;
import com.medsync.auth.exception.NotFoundException;
import com.medsync.auth.exception.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Component
@RequiredArgsConstructor
public class UsersServiceClient {

    private final RestTemplate restTemplate;

    @Value("${app.users-service-url}")
    private String usersServiceUrl;

    @Value("${app.internal-token}")
    private String internalToken;

    public InternalUserResponse findByEmail(String email) {
        String url = UriComponentsBuilder
                .fromHttpUrl(usersServiceUrl)
                .path("/api/users/internal/by-email")
                .queryParam("email", email)
                .toUriString();

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Internal-Token", internalToken);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<InternalUserResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    InternalUserResponse.class
            );
            return response.getBody();
        } catch (HttpClientErrorException.NotFound ex) {
            throw new NotFoundException("User not found");
        } catch (HttpClientErrorException.Unauthorized | HttpClientErrorException.Forbidden ex) {
            throw new UnauthorizedException("Could not validate user credentials");
        }
    }
}
