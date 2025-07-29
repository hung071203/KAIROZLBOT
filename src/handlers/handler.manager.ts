import * as fs from "fs";
import * as path from "path";
import {
  AnyModule,
  CommandModule,
  EventModule,
  GroupCommands,
  GroupEvents,
  NoPrefixModule,
  OnLoadModule,
  ReactionModule,
  ReplyModule,
  UndoModule,
} from "../common/types";
import { Logger } from "../utils/logger.util";

export class HandlerManager {
  private commands: Map<string, CommandModule> = new Map();
  private replies: Map<string, ReplyModule> = new Map();
  private events: Map<string, EventModule> = new Map();
  private reactions: Map<string, ReactionModule> = new Map();
  private undos: Map<string, UndoModule> = new Map();
  private onLoads: Map<string, OnLoadModule> = new Map();
  private noPrefix: Map<string, NoPrefixModule> = new Map();
  private anyHandlers: Map<string, AnyModule> = new Map();

  private commandPath: string = path.join(__dirname, "../modules/commands");
  private eventPath: string = path.join(__dirname, "../modules/events");

  constructor() {}

  async loadGroupCommands() {
    const files = fs.readdirSync(this.commandPath).filter((file) => {
      return (
        (file.endsWith(".js") || file.endsWith(".ts")) &&
        !file.endsWith(".d.ts")
      );
    });

    for (const file of files) {
      const commandModulePath = path.join(this.commandPath, file);
      const imported = await import(commandModulePath);
      const module: GroupCommands = imported.default || imported;

      if (!module?.config?.name) continue;

      const commandName = module.config.name;
      if (module.run) {
        if (this.commands.has(commandName)) {
          Logger.warn(`⚠️ Command "${commandName}" đã tồn tại, sẽ bị ghi đè.`);
        }
        this.commands.set(commandName, module as CommandModule);
        Logger.success(`✅ Đã load được command: ${commandName}`);
      }

      // Nếu có handlerUndo
      if (module.handlerUndo) {
        if (this.undos.has(commandName)) {
          Logger.warn(
            `⚠️ Undo handler "${commandName}" đã tồn tại, sẽ bị ghi đè.`
          );
        }
        this.undos.set(commandName, module as UndoModule);
        Logger.success(`✅ Đã load được undo handler: ${commandName}`);
      }

      if (module.handlerReply) {
        if (this.replies.has(commandName)) {
          Logger.warn(
            `⚠️ Reply handler "${commandName}" đã tồn tại, sẽ bị ghi đè.`
          );
        }
        this.replies.set(commandName, module as ReplyModule);
        Logger.success(`✅ Đã load được reply handler: ${commandName}`);
      }

      // Nếu có handlerReaction
      if (module.handlerReaction) {
        if (this.reactions.has(commandName)) {
          Logger.warn(
            `⚠️ Reaction handler "${commandName}" đã tồn tại, sẽ bị ghi đè.`
          );
        }
        this.reactions.set(commandName, module as ReactionModule);
        Logger.success(`✅ Đã load được reaction handler: ${commandName}`);
      }

      // Nếu có noPrefix
      if (module.noPrefix) {
        if (this.noPrefix.has(commandName)) {
          Logger.warn(
            `⚠️ NoPrefix handler "${commandName}" đã tồn tại, sẽ bị ghi đè.`
          );
        }
        this.noPrefix.set(commandName, module as NoPrefixModule);
        Logger.success(`✅ Đã load được noPrefix handler: ${commandName}`);
      }

      // Nếu có onLoad
      if (module.onLoad) {
        if (this.onLoads.has(commandName)) {
          Logger.warn(
            `⚠️ OnLoad handler "${commandName}" đã tồn tại, sẽ bị ghi đè.`
          );
        }
        this.onLoads.set(commandName, module as OnLoadModule);
        Logger.success(`✅ Đã load được onLoad handler: ${commandName}`);
      }

      // Nếu có anyHandler
      if (module.anyHandler) {
        if (this.anyHandlers.has(commandName)) {
          Logger.warn(
            `⚠️ Any handler "${commandName}" đã tồn tại, sẽ bị ghi đè.`
          );
        }
        this.anyHandlers.set(commandName, module as AnyModule);
        Logger.success(`✅ Đã load được any handler: ${commandName}`);
      }
    }
  }

  async loadGroupEvents() {
    const files = fs.readdirSync(this.eventPath).filter((file) => {
      return (
        (file.endsWith(".js") || file.endsWith(".ts")) &&
        !file.endsWith(".d.ts")
      );
    });
    for (const file of files) {
      const eventModulePath = path.join(this.eventPath, file);
      const imported = await import(eventModulePath);
      const module: GroupEvents = imported.default || imported;

      if (!module?.config?.name || !module.handlerEvent) continue;

      const eventName = module?.config?.name;
      if (module.handlerEvent) {
        if (this.events.has(eventName)) {
          Logger.warn(`⚠️ Event "${eventName}" đã tồn tại, sẽ bị ghi đè.`);
        }
        this.events.set(eventName, module as EventModule);
        Logger.success(`✅ Đã load được event: ${eventName}`);
      }

      // Nếu có onLoad
      if (module.onLoad) {
        if (this.onLoads.has(eventName)) {
          Logger.warn(
            `⚠️ OnLoad handler "${eventName}" đã tồn tại, sẽ bị ghi đè.`
          );
        }
        this.onLoads.set(eventName, module as OnLoadModule);
        Logger.success(`✅ Đã load được onLoad handler: ${eventName}`);
      }

      // Nếu có anyHandler
      if (module.anyHandler) {
        if (this.anyHandlers.has(eventName)) {
          Logger.warn(
            `⚠️ Any handler "${eventName}" đã tồn tại, sẽ bị ghi đè.`
          );
        }
        this.anyHandlers.set(eventName, module as AnyModule);
        Logger.success(`✅ Đã load được any handler: ${eventName}`);
      }
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
    this.events.clear();
    this.onLoads.clear();
    this.noPrefix.clear();
    this.anyHandlers.clear();
    await this.loadGroupCommands();
    await this.loadGroupEvents();
    Logger.success("✅ Đã reload tất cả handlers.");
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

  /**
   * Get onLoad list
   */
  getOnLoads(): Map<string, OnLoadModule> {
    return this.onLoads;
  }

  /**
   * Get noPrefix list
   */
  getNoPrefix(): Map<string, NoPrefixModule> {
    return this.noPrefix;
  }

  /**
   * Get anyHandlers list
   */
  getAnyHandlers(): Map<string, AnyModule> {
    return this.anyHandlers;
  }
}
