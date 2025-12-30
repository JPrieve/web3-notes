import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const NotesModule = buildModule("NotesModule", (m) => {
  const notes = m.contract("Notes");

  return { notes };
});

export default NotesModule;