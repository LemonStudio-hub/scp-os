import { ANSICode } from './theme'
import { config } from '../config'

/**
 * 系统启动日志配置
 */
export const BOOT_LOGS_CONFIG = {
  /**
   * 快速模式 - 只显示关键信息
   */
  fastMode: [
    `${ANSICode.green}[    0.000000] SCP Foundation System v${config.app.version} Initializing...${ANSICode.reset}`,
    `${ANSICode.green}[    0.000100] Security Protocols: ACTIVE${ANSICode.reset}`,
    `${ANSICode.green}[    0.000200] Network Connection: ESTABLISHED${ANSICode.reset}`,
    `${ANSICode.green}[    0.000300] Terminal Interface: READY${ANSICode.reset}`,
    `${ANSICode.green}[    0.000400] System Boot: COMPLETE${ANSICode.reset}`,
    '',
    `${ANSICode.green}[    0.000500] ████████████████████████████████████████████████████████████████${ANSICode.reset}`,
    `${ANSICode.green}[    0.000600] █     SCP Foundation - Site-19 Terminal System v${config.app.version}     █${ANSICode.reset}`,
    `${ANSICode.green}[    0.000700] ████████████████████████████████████████████████████████████████${ANSICode.reset}`,
    `${ANSICode.green}[    0.000800] █  System Status: ONLINE                                    █${ANSICode.reset}`,
    `${ANSICode.green}[    0.000900] ████████████████████████████████████████████████████████████████${ANSICode.reset}`,
    '',
    `${ANSICode.green}[    0.001000] All systems operational. Ready for commands.${ANSICode.reset}`,
    '',
  ],

  /**
   * 正常模式 - 完整的启动日志
   */
  normalMode: [
    // ASCII Art Header
    `${ANSICode.green}`,
    '   _____ __________ ',
    '  / ___// ____/ __ \\',
    '  \\__ \\/ /   / /_/ /',
    ' ___/ / /___/ ____/ ',
    '/____/\\____/_/      ',
    '                    ',
    '   Foundation Terminal System',
    `${ANSICode.reset}`,
    '',
    `${ANSICode.green}[    0.000000] Linux version 6.17.0-PRoot-SCP (scpos@site19) (gcc version 14.2.1)${ANSICode.reset}`,
    `${ANSICode.white}[    0.000001] Command line: BOOT_IMAGE=/boot/vmlinuz-6.17.0-PRoot-SCP root=UUID=scp-secure-19 ro quiet${ANSICode.reset}`,
    `${ANSICode.yellow}[    0.000002] x86/fpu: Supporting XSAVE feature 0x001: 'x87 floating point registers'${ANSICode.reset}`,
    `${ANSICode.white}[    0.000003] x86/fpu: Supporting XSAVE feature 0x002: 'SSE registers'${ANSICode.reset}`,
    `${ANSICode.white}[    0.000004] BIOS-provided physical RAM map:${ANSICode.reset}`,
    `${ANSICode.white}[    0.000005] BIOS-e820: [mem 0x0000000000000000-0x000000000009ffff] usable${ANSICode.reset}`,
    `${ANSICode.green}[    0.000010] Secure Boot: enabled (SCP Foundation Secure Boot)${ANSICode.reset}`,
    `${ANSICode.white}[    0.000015] NX (Execute Disable) protection: active${ANSICode.reset}`,
    `${ANSICode.white}[    0.000020] SMBIOS 3.4.0 present.${ANSICode.reset}`,
    `${ANSICode.green}[    0.000025] DMI: SCP Foundation/Site-19 Mainframe, BIOS 3.0.1 03/31/26 14:30:00${ANSICode.reset}`,
    `${ANSICode.yellow}[    0.000100] ACPI: DSDT 0000000000000000 (v02 SCPF Site19 00001000 SCPF 00000001)${ANSICode.reset}`,
    `${ANSICode.white}[    0.000150] ACPI: Using IOAPIC for interrupt routing${ANSICode.reset}`,
    `${ANSICode.green}[    0.000200] PCI: Using configuration type 1${ANSICode.reset}`,
    `${ANSICode.white}[    0.000250] ACPI: Core revision 20220331${ANSICode.reset}`,
    `${ANSICode.yellow}[    0.000300] SCP-Security: Initializing containment protocols...${ANSICode.reset}`,
    `${ANSICode.green}[    0.000350] SCP-Security: Containment protocols loaded successfully${ANSICode.reset}`,
    `${ANSICode.white}[    0.000400] clocksource: tsc: mask: 0xffffffff max_cycles: 0xffffffff, max_idle_ns: 7645041785499908${ANSICode.reset}`,
    `${ANSICode.white}[    0.000450] clocksource: hpet: mask: 0xffffffff max_cycles: 0xffffffff, max_idle_ns: 13320449974259208${ANSICode.reset}`,
    `${ANSICode.green}[    0.000500] tsc: Detected 4200.000 MHz processor${ANSICode.reset}`,
    `${ANSICode.white}[    0.000550] tsc: Detected 2100.000 MHz base frequency${ANSICode.reset}`,
    `${ANSICode.yellow}[    0.000600] SCP-Kernel: Loading anomaly detection modules...${ANSICode.reset}`,
    `${ANSICode.green}[    0.000700] SCP-Kernel: Anomaly detection modules loaded (4891 anomalies detected)${ANSICode.reset}`,
    `${ANSICode.green}[    0.000800] tsc: Detected 4200.000 MHz processor${ANSICode.reset}`,
    `${ANSICode.white}[    0.000900] ACPI: \\_OSI (Linux) query successful${ANSICode.reset}`,
    `${ANSICode.yellow}[    0.001000] SCP-Security: Establishing encrypted connection to Foundation Network...${ANSICode.reset}`,
    `${ANSICode.green}[    0.002000] SCP-Security: AES-256-GCM encryption established${ANSICode.reset}`,
    `${ANSICode.green}[    0.003000] ACPI: 1 ACPI AML tables successfully loaded and 0 ACPI AML tables failed${ANSICode.reset}`,
    `${ANSICode.white}[    0.003100] APIC: Switch to symmetric I/O mode setup${ANSICode.reset}`,
    `${ANSICode.yellow}[    0.003200] SCP-Network: Connecting to Site-19 containment database...${ANSICode.reset}`,
    `${ANSICode.green}[    0.003300] SCP-Network: Connection established (latency: 2ms)${ANSICode.reset}`,
    `${ANSICode.green}[    0.003400] clocksource: acpi_pm: mask: 0xffffff max_cycles: 0xffffff, max_idle_ns: 2085701024 ns${ANSICode.reset}`,
    `${ANSICode.yellow}[    0.003500] SCP-Storage: Mounting secure storage volumes...${ANSICode.reset}`,
    `${ANSICode.green}[    0.003600] SCP-Storage: Volume /scp-secure mounted (AES-256 encrypted)${ANSICode.reset}`,
    `${ANSICode.green}[    0.003700] libata version 3.00 loaded.${ANSICode.reset}`,
    `${ANSICode.white}[    0.003800] ACPI: bus type SATA registered${ANSICode.reset}`,
    `${ANSICode.green}[    0.003900] ahci 0000:00:1f.2: version 3.0${ANSICode.reset}`,
    `${ANSICode.green}[    0.004000] scsi host0: ahci${ANSICode.reset}`,
    `${ANSICode.green}[    0.004100] scsi host1: ahci${ANSICode.reset}`,
    `${ANSICode.white}[    0.004200] ata1: SATA link up 6.0 Gbps (SStatus 133 SControl 300)${ANSICode.reset}`,
    `${ANSICode.white}[    0.004300] ata1.00: ATA-9: SCP-SSD-256G, 3.0.1, max UDMA/133${ANSICode.reset}`,
    `${ANSICode.green}[    0.004400] ata1.00: configured for UDMA/133${ANSICode.reset}`,
    `${ANSICode.white}[    0.004500] scsi 0:0:0:0: Direct-Access     SCP-SSD-256G  3.0  PQ: 0 ANSI: 6${ANSICode.reset}`,
    `${ANSICode.green}[    0.004600] sd 0:0:0:0: [sda] 500118192 512-byte logical blocks: (256 GB/238 GiB)${ANSICode.reset}`,
    `${ANSICode.green}[    0.004700] sd 0:0:0:0: [sda] Write Protect is off${ANSICode.reset}`,
    `${ANSICode.white}[    0.004800] sd 0:0:0:0: [sda] Mode Sense: 4b 00 00 00${ANSICode.reset}`,
    `${ANSICode.green}[    0.004900] sd 0:0:0:0: [sda] Write cache: enabled, read cache: enabled, doesn't support DPO or FUA${ANSICode.reset}`,
    `${ANSICode.yellow}[    0.005000] sda: sda1 sda2 sda3 sda4${ANSICode.reset}`,
    `${ANSICode.green}[    0.005100] EXT4-fs (sda1): mounted filesystem with ordered data mode. Opts: (null)${ANSICode.reset}`,
    `${ANSICode.green}[    0.005200] EXT4-fs (sda1): recovery complete${ANSICode.reset}`,
    `${ANSICode.white}[    0.005300] systemd[1]: Detected architecture x86-64.${ANSICode.reset}`,
    `${ANSICode.yellow}[    0.005400] systemd[1]: Initializing SCP Foundation system...${ANSICode.reset}`,
    `${ANSICode.green}[    0.005500] systemd[1]: System initialized.${ANSICode.reset}`,
    `${ANSICode.green}[    0.005600] systemd[1]: Starting Network Service...${ANSICode.reset}`,
    `${ANSICode.green}[    0.005700] systemd[1]: Started Network Service.${ANSICode.reset}`,
    `${ANSICode.yellow}[    0.005800] SCP-Network: Establishing secure tunnel to Foundation HQ...${ANSICode.reset}`,
    `${ANSICode.green}[    0.005900] SCP-Network: Secure tunnel established (VPN: Foundation-256)${ANSICode.reset}`,
    `${ANSICode.white}[    0.006000] systemd[1]: Reached target Network.${ANSICode.reset}`,
    `${ANSICode.white}[    0.006100] systemd[1]: Reached target Remote File Systems.${ANSICode.reset}`,
    `${ANSICode.green}[    0.006200] systemd[1]: Reached target System Initialization.${ANSICode.reset}`,
    `${ANSICode.green}[    0.006300] systemd[1]: Started Daily Cleanup of Temporary Directories.${ANSICode.reset}`,
    `${ANSICode.yellow}[    0.006400] SCP-Security: Verifying personnel credentials...${ANSICode.reset}`,
    `${ANSICode.green}[    0.006500] SCP-Security: Personnel credentials verified (Level 4 access granted)${ANSICode.reset}`,
    `${ANSICode.green}[    0.006600] systemd[1]: Reached target Multi-User System.${ANSICode.reset}`,
    `${ANSICode.green}[    0.006700] systemd[1]: Reached target Graphical Interface.${ANSICode.reset}`,
    `${ANSICode.yellow}[    0.006800] SCP-System: Starting terminal interface...${ANSICode.reset}`,
    `${ANSICode.green}[    0.006900] SCP-System: Terminal interface ready.${ANSICode.reset}`,
    '',
    `${ANSICode.green}[    0.007000] ████████████████████████████████████████████████████████████████${ANSICode.reset}`,
    `${ANSICode.green}[    0.007100] █     SCP Foundation - Site-19 Terminal System v${config.app.version}     █${ANSICode.reset}`,
    `${ANSICode.green}[    0.007200] ████████████████████████████████████████████████████████████████${ANSICode.reset}`,
    `${ANSICode.green}[    0.007300] █                                                          █${ANSICode.reset}`,
    `${ANSICode.green}[    0.007400] █  System Status: ONLINE                                    █${ANSICode.reset}`,
    `${ANSICode.green}[    0.007500] █  Containment Status: 4891 ACTIVE | 23 FAILED               █${ANSICode.reset}`,
    `${ANSICode.green}[    0.007600] █  Security Level: 4 (Maximum)                              █${ANSICode.reset}`,
    `${ANSICode.green}[    0.007700] █  Network: ENCRYPTED (AES-256-GCM)                          █${ANSICode.reset}`,
    `${ANSICode.green}[    0.007800] █  Location: Site-19, Foundation Network                     █${ANSICode.reset}`,
    `${ANSICode.green}[    0.007900] █                                                          █${ANSICode.reset}`,
    `${ANSICode.green}[    0.008000] ████████████████████████████████████████████████████████████████${ANSICode.reset}`,
    `${ANSICode.green}[    0.008100] █  Secure • Contain • Protect                               █${ANSICode.reset}`,
    `${ANSICode.green}[    0.008200] ████████████████████████████████████████████████████████████████${ANSICode.reset}`,
    '',
    `${ANSICode.green}[    0.008300] System boot completed successfully in 8.3 seconds${ANSICode.reset}`,
    `${ANSICode.green}[    0.008400] All systems operational. Ready for commands.${ANSICode.reset}`,
    '',
  ],
}

/**
 * 获取启动日志
 * @param fastMode 是否使用快速模式
 * @returns 启动日志数组
 */
export function getBootLogs(fastMode: boolean = false): string[] {
  return fastMode ? BOOT_LOGS_CONFIG.fastMode : BOOT_LOGS_CONFIG.normalMode
}

/**
 * 系统关机日志配置
 */
export const SHUTDOWN_LOGS_CONFIG = {
  /**
   * 快速模式 - 只显示关键信息
   */
  fastMode: [
    `${ANSICode.yellow}[  0.000000] Initiating system shutdown...${ANSICode.reset}`,
    `${ANSICode.green}[  0.000100] Stopping SCP Foundation Terminal System...${ANSICode.reset}`,
    `${ANSICode.green}[  0.000200] Stopping Command Handler Service...${ANSICode.reset}`,
    `${ANSICode.green}[  0.000300] Stopping Terminal Emulator...${ANSICode.reset}`,
    `${ANSICode.green}[  0.000400] Stopping IndexedDB Service...${ANSICode.reset}`,
    `${ANSICode.green}[  0.000500] Stopping Network Services...${ANSICode.reset}`,
    `${ANSICode.green}[  0.000600] Syncing filesystems...${ANSICode.reset}`,
    `${ANSICode.red}[  0.000700] System halted${ANSICode.reset}`,
    '',
  ],

  /**
   * 正常模式 - 完整的关机日志
   */
  normalMode: [
    `${ANSICode.yellow}[  0.000000] System is going down for halt NOW!${ANSICode.reset}`,
    `${ANSICode.white}[  0.000100] Stopping Systemd target paths...${ANSICode.reset}`,
    `${ANSICode.green}[  0.000200] [  OK  ] Stopped target Paths.${ANSICode.reset}`,
    `${ANSICode.white}[  0.000300] Stopping Network Service...${ANSICode.reset}`,
    `${ANSICode.green}[  0.000400] [  OK  ] Stopped Network Service.${ANSICode.reset}`,
    `${ANSICode.white}[  0.000500] Stopping SCP Foundation Terminal System...${ANSICode.reset}`,
    `${ANSICode.green}[  0.000600] [  OK  ] Stopped SCP Foundation Terminal System.${ANSICode.reset}`,
    `${ANSICode.white}[  0.000700] Stopping Command Handler Service...${ANSICode.reset}`,
    `${ANSICode.green}[  0.000800] [  OK  ] Stopped Command Handler Service.${ANSICode.reset}`,
    `${ANSICode.white}[  0.000900] Stopping Terminal Emulator...${ANSICode.reset}`,
    `${ANSICode.green}[  0.001000] [  OK  ] Stopped Terminal Emulator.${ANSICode.reset}`,
    `${ANSICode.white}[  0.001100] Stopping IndexedDB Service...${ANSICode.reset}`,
    `${ANSICode.green}[  0.001200] [  OK  ] Stopped IndexedDB Service.${ANSICode.reset}`,
    `${ANSICode.white}[  0.001300] Stopping Secure Storage Service...${ANSICode.reset}`,
    `${ANSICode.green}[  0.001400] [  OK  ] Stopped Secure Storage Service.${ANSICode.reset}`,
    `${ANSICode.white}[  0.001500] Unmounting /scp-secure...${ANSICode.reset}`,
    `${ANSICode.green}[  0.001600] [  OK  ] Unmounted /scp-secure.${ANSICode.reset}`,
    `${ANSICode.white}[  0.001700] Unmounting /var/lib...${ANSICode.reset}`,
    `${ANSICode.green}[  0.001800] [  OK  ] Unmounted /var/lib.${ANSICode.reset}`,
    `${ANSICode.white}[  0.001900] Unmounting /tmp...${ANSICode.reset}`,
    `${ANSICode.green}[  0.002000] [  OK  ] Unmounted /tmp.${ANSICode.reset}`,
    `${ANSICode.white}[  0.002100] Unmounting File Systems...${ANSICode.reset}`,
    `${ANSICode.green}[  0.002200] [  OK  ] Unmounted File Systems.${ANSICode.reset}`,
    `${ANSICode.white}[  0.002300] Syncing filesystems...${ANSICode.reset}`,
    `${ANSICode.green}[  0.002400] [  OK  ] Synced filesystems.${ANSICode.reset}`,
    `${ANSICode.white}[  0.002500] Deactivating swap...${ANSICode.reset}`,
    `${ANSICode.green}[  0.002600] [  OK  ] Deactivated swap.${ANSICode.reset}`,
    `${ANSICode.white}[  0.002700] Stopping remaining processes...${ANSICode.reset}`,
    `${ANSICode.green}[  0.002800] [  OK  ] Stopped remaining processes.${ANSICode.reset}`,
    `${ANSICode.white}[  0.002900] Unmounting temporary filesystems...${ANSICode.reset}`,
    `${ANSICode.green}[  0.003000] [  OK  ] Unmounted temporary filesystems.${ANSICode.reset}`,
    `${ANSICode.white}[  0.003100] Shutting down SCP Security Protocols...${ANSICode.reset}`,
    `${ANSICode.green}[  0.003200] [  OK  ] SCP Security Protocols shutdown.${ANSICode.reset}`,
    `${ANSICode.white}[  0.003300] Closing secure network connections...${ANSICode.reset}`,
    `${ANSICode.green}[  0.003400] [  OK  ] Secure network connections closed.${ANSICode.reset}`,
    `${ANSICode.white}[  0.003500] Flushing caches...${ANSICode.reset}`,
    `${ANSICode.green}[  0.003600] [  OK  ] Caches flushed.${ANSICode.reset}`,
    `${ANSICode.red}[  0.003700] System halted.${ANSICode.reset}`,
    '',
    // ASCII Art Footer
    `${ANSICode.green}`,
    '   _____ __________ ',
    '  / ___// ____/ __ \\',
    '  \\__ \\/ /   / /_/ /',
    ' ___/ / /___/ ____/ ',
    '/____/\\____/_/      ',
    '                    ',
    '   System Halted',
    `${ANSICode.reset}`,
    '',
  ],
}

/**
 * 获取关机日志
 * @param fastMode 是否使用快速模式
 * @returns 关机日志数组
 */
export function getShutdownLogs(fastMode: boolean = false): string[] {
  return fastMode ? SHUTDOWN_LOGS_CONFIG.fastMode : SHUTDOWN_LOGS_CONFIG.normalMode
}
