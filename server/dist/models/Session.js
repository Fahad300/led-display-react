"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Session = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
let Session = class Session {
    // Helper methods for JSON handling
    getDisplaySettings() {
        try {
            return this.displaySettings ? JSON.parse(this.displaySettings) : {};
        }
        catch {
            return {};
        }
    }
    setDisplaySettings(settings) {
        this.displaySettings = JSON.stringify(settings);
    }
    getSlideData() {
        try {
            return this.slideData ? JSON.parse(this.slideData) : [];
        }
        catch {
            return [];
        }
    }
    setSlideData(slides) {
        this.slideData = JSON.stringify(slides);
    }
    getAppSettings() {
        try {
            return this.appSettings ? JSON.parse(this.appSettings) : {};
        }
        catch {
            return {};
        }
    }
    setAppSettings(settings) {
        this.appSettings = JSON.stringify(settings);
    }
};
exports.Session = Session;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Session.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Session.prototype, "sessionToken", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Session.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "userId" }),
    __metadata("design:type", User_1.User)
], Session.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Session.prototype, "displaySettings", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Session.prototype, "slideData", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Session.prototype, "appSettings", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Session.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Session.prototype, "lastActivity", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Session.prototype, "deviceInfo", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Session.prototype, "ipAddress", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Session.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Session.prototype, "updatedAt", void 0);
exports.Session = Session = __decorate([
    (0, typeorm_1.Entity)("sessions")
], Session);
