package com.airis.message.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;

/**
 * Swagger configuration class
 * Configure API documentation and JWT authentication
 * 
 * @author AIRIS Team
 * @since 1.0.0
 */
@Configuration
public class SwaggerConfig {

    private static final String SECURITY_SCHEME_NAME = "Bearer Authentication";
    
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("AIRIS Message Service API")
                        .description("AIRIS Message Service API documentation")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("AIRIS Team")
                                .email("airis-team@example.com")
                                .url("https://github.com/airis/message-service"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0")))
                .servers(Arrays.asList(
                        new Server().url("http://localhost:9330").description("Development"),
                        new Server().url("https://api.example.com").description("Production")))
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME, new SecurityScheme()
                                .name(SECURITY_SCHEME_NAME)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Please enter JWT Bearer Token in format: Bearer <token>")));
    }
} 