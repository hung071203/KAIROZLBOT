import * as fs from "fs";
import * as path from "path";
import {
  CommandModule,
  EventModule,
  ReactionModule,
  ReplyModule,
  UndoModule,
} from "../common/types";

export class HandlerManager {
  private commands: Map<string, CommandModule> = new Map();
  private replies: Map<string, ReplyModule> = new Map();
  private events: Map<string, EventModule> = new Map();
  private reactions: Map<string, ReactionModule> = new Map();
  private undos: Map<string, UndoModule> = new Map();
  private commandPath: string = path.join(__dirname, "../modules/commands");
  private eventPath: string = path.join(__dirname, "../modules/events");

  constructor() {}

  async loadHandlers() {
    const files = fs
      .readdirSync(this.commandPath)
      .filter((file) => file.endsWith(".js") && !file.endsWith(".d.ts"));
    for (const file of files) {
      const commandModulePath = path.join(this.commandPath, file);
      const imported = await import(commandModulePath);
      const module: CommandModule = imported.default || imported;

      if (!module?.config?.name) continue;

      const commandName = module.config.name;
      if (this.commands.has(commandName)) {
        console.warn(`⚠️ Command "${commandName}" đã tồn tại, sẽ bị ghi đè.`);
      }
      this.commands.set(commandName, module);

      // Nếu có handlerUndo
      if ("handlerUndo" in module) {
        this.undos.set(commandName, module as UndoModule);
      }

      if ("handlerReply" in module) {
        this.replies.set(commandName, module as ReplyModule);
      }

      // Nếu có handlerReaction
      if ("handlerReaction" in module) {
        this.reactions.set(commandName, module as ReactionModule);
      }
    }
  }

  async loadEvents() {
    const files = fs
      .readdirSync(this.eventPath)
      .filter((file) => file.endsWith(".js") && !file.endsWith(".d.ts"));
    for (const file of files) {
      const eventModulePath = path.join(this.eventPath, file);
      const imported = await import(eventModulePath);
      const module: EventModule = imported.default || imported;

      if (!module?.config?.name || !module.handlerEvent) continue;

      const eventName = module?.config?.name;
      if (this.events.has(eventName)) {
        console.warn(`⚠️ Event "${eventName}" đã tồn tại, sẽ bị ghi đè.`);
      }

      this.events.set(eventName, module);
    }
  }

  /**
   * Reload commands
   */
  async reloadHandlers() {
    this.commands.clear();
    this.replies.clear();
    this.reactions.clear();
    this.undos.clear();
    await this.loadHandlers();
  }

  /**
   * Reload events
   */
  async reloadEvents() {
    this.events.clear();
    await this.loadEvents();
  }

  /**
   * Get command list
   */
  getCommands(): Map<string, CommandModule> {
    return this.commands;
  }

  /**
   * Get reply list
   */

  getReplies(): Map<string, ReplyModule> {
    return this.replies;
  }

  /**
   * Get reaction list
   */
  getReactions(): Map<string, ReactionModule> {
    return this.reactions;
  }

  /**
   * Get undo list
   */
  getUndos(): Map<string, UndoModule> {
    return this.undos;
  }

  /**
   * Get event list
   */
  getEvents(): Map<string, EventModule> {
    return this.events;
  }
}
