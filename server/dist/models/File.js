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
exports.File = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
let File = class File {
    /**
     * Get file URL for serving
     */
    getUrl() {
        return `/api/files/${this.id}`;
    }
    /**
     * Get file extension
     */
    getExtension() {
        return this.originalName.split('.').pop() || '';
    }
    /**
     * Check if file is an image
     */
    isImage() {
        return this.mimeType.startsWith('image/');
    }
    /**
     * Check if file is a video
     */
    isVideo() {
        return this.mimeType.startsWith('video/');
    }
    /**
     * Check if file is a document
     */
    isDocument() {
        return this.mimeType.startsWith('application/');
    }
};
exports.File = File;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], File.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], File.prototype, "filename", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], File.prototype, "originalName", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], File.prototype, "mimeType", void 0);
__decorate([
    (0, typeorm_1.Column)("longtext"),
    __metadata("design:type", String)
], File.prototype, "data", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], File.prototype, "size", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], File.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: "uploaded_by" }),
    __metadata("design:type", User_1.User)
], File.prototype, "uploadedBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], File.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], File.prototype, "updatedAt", void 0);
exports.File = File = __decorate([
    (0, typeorm_1.Entity)("files")
], File);
