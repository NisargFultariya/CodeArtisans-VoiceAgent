package com.vedanova.platform.api.controller

import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.GetMapping

@Controller
class SpaController {
    @GetMapping(
        "/",
        "/compliance",
        "/privacy",
        "/terms",
        "/request-demo",
        "/demo",
        "/install",
        "/admin",
        "/admin/",
        "/admin/login",
        "/admin/shops",
        "/admin/calls",
        "/admin/escalations",
        "/admin/demo-invites",
        "/portal",
        "/portal/",
        "/portal/login",
        "/login",
        "/signup",
        "/app",
        "/app/{*path}"
    )
    fun spa(): String = "forward:/index.html"
}
