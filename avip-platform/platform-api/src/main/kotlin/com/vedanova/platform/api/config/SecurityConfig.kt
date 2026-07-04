package com.vedanova.platform.api.config

import com.vedanova.platform.config.AvipProperties
import com.vedanova.platform.api.service.AdminAuthService
import com.vedanova.platform.api.service.PortalAuthService
import com.vedanova.platform.api.controller.portal.PortalSessionSupport
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpStatus
import org.springframework.web.filter.OncePerRequestFilter

@Configuration
class SecurityConfig(
    private val avipProperties: AvipProperties,
    private val adminAuthService: AdminAuthService,
    private val portalAuthService: PortalAuthService,
) {
    @Bean
    fun internalAuthFilter(): OncePerRequestFilter =
        object : OncePerRequestFilter() {
            override fun shouldNotFilter(request: HttpServletRequest): Boolean =
                !request.requestURI.startsWith("/internal/")

            override fun doFilterInternal(
                request: HttpServletRequest,
                response: HttpServletResponse,
                filterChain: FilterChain,
            ) {
                val secret = request.getHeader("x-avip-internal-secret").orEmpty()
                if (secret.isBlank() || secret != avipProperties.internalSecret) {
                    response.sendError(HttpStatus.UNAUTHORIZED.value())
                    return
                }
                filterChain.doFilter(request, response)
            }
        }

    @Bean
    fun adminAuthFilter(): OncePerRequestFilter =
        object : OncePerRequestFilter() {
            override fun shouldNotFilter(request: HttpServletRequest): Boolean {
                val path = request.requestURI
                if (!path.startsWith("/admin/api/")) {
                    return true
                }
                return path == "/admin/api/auth/login" && request.method.equals("POST", ignoreCase = true)
            }

            override fun doFilterInternal(
                request: HttpServletRequest,
                response: HttpServletResponse,
                filterChain: FilterChain,
            ) {
                val authHeader = request.getHeader("Authorization").orEmpty()
                val token =
                    if (authHeader.startsWith("Bearer ", ignoreCase = true)) {
                        authHeader.substring(7).trim()
                    } else {
                        ""
                    }
                if (token.isBlank()) {
                    response.sendError(HttpStatus.UNAUTHORIZED.value())
                    return
                }
                try {
                    val username = adminAuthService.validateToken(token)
                    request.setAttribute("adminUsername", username)
                    filterChain.doFilter(request, response)
                } catch (ex: org.springframework.web.server.ResponseStatusException) {
                    response.sendError(ex.statusCode.value(), ex.reason)
                }
            }
        }

    @Bean
    fun portalAuthFilter(): OncePerRequestFilter =
        object : OncePerRequestFilter() {
            override fun shouldNotFilter(request: HttpServletRequest): Boolean {
                val path = request.requestURI
                if (!path.startsWith("/portal/api/")) {
                    return true
                }
                if (path == "/portal/api/auth/request-login" && request.method.equals("POST", ignoreCase = true)) {
                    return true
                }
                if (path == "/portal/api/auth/logout" && request.method.equals("POST", ignoreCase = true)) {
                    return true
                }
                return false
            }

            override fun doFilterInternal(
                request: HttpServletRequest,
                response: HttpServletResponse,
                filterChain: FilterChain,
            ) {
                val token =
                    PortalSessionSupport.extractSessionToken(
                        request,
                        avipProperties.portal.accessCookieName,
                    )
                if (token.isNullOrBlank()) {
                    response.sendError(HttpStatus.UNAUTHORIZED.value())
                    return
                }
                try {
                    val session = portalAuthService.validateSession(token)
                    request.setAttribute("portalSession", session)
                    filterChain.doFilter(request, response)
                } catch (ex: org.springframework.web.server.ResponseStatusException) {
                    response.sendError(ex.statusCode.value(), ex.reason)
                }
            }
        }
}
