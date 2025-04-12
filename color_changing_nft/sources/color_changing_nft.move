#[allow(duplicate_alias, unused_use, unused_const, unused_variable)]
module color_changing_nft::dynamic_nft {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::clock::{Self, Clock};
    use sui::event;
    use sui::display;
    use sui::package;
    use std::string::{Self, String};

    // Error codes
    const ENotAuthorized: u64 = 0;
    const EInvalidColorChangeTime: u64 = 1;

    // One Time Witness for the package
    public struct DYNAMIC_NFT has drop {}

    // Capability to update the oracle
    public struct AdminCap has key, store {
        id: UID
    }

    // The oracle that will trigger color changes
    public struct TimeOracle has key {
        id: UID,
        // How often to update in seconds (3600 = 1 hour)
        // This is now just a default value for new NFTs
        update_interval: u64
    }

    // The NFT itself
    public struct DynamicNFT has key, store {
        id: UID,
        // The current state (0 or 1)
        current_state: u8,
        // First image/color representation
        image_one: String,
        // Second image/color representation
        image_two: String,
        // Additional metadata
        name: String,
        description: String,
        // Last time the NFT was updated
        last_updated: u64,
        // Current image based on state
        current_image: String,
        // Individual update interval in seconds
        // This allows each NFT to have its own schedule
        update_interval: u64,
        owner: address
    }

    // Event emitted when the NFT color changes
    public struct ColorChangeEvent has copy, drop {
        nft_id: address,
        new_state: u8,
        timestamp: u64
    }

    // Event emitted when an NFT's update interval changes
    public struct UpdateIntervalEvent has copy, drop {
        nft_id: address,
        new_interval: u64,
        timestamp: u64
    }

    // ===== Module Initialization =====
    
    fun init(otw: DYNAMIC_NFT, ctx: &mut TxContext) {
        // Create and share the TimeOracle
        let oracle = TimeOracle {
            id: object::new(ctx),
            update_interval: 300 // 5 minutes in seconds (default)
        };
        transfer::share_object(oracle);
        
        // Create and transfer the admin capability to the deployer
        let admin_cap = AdminCap {
            id: object::new(ctx)
        };
        transfer::transfer(admin_cap, tx_context::sender(ctx));

        // Setup the Publisher for the display
        let publisher = package::claim(otw, ctx);
        
        // Setup display for the NFT
        let keys = vector[
            string::utf8(b"name"),
            string::utf8(b"description"),
            string::utf8(b"image_url"),
            string::utf8(b"current_state"),
            string::utf8(b"update_interval"),
        ];
        
        let values = vector[
            string::utf8(b"{name}"),
            string::utf8(b"{description}"),
            string::utf8(b"{current_image}"),
            string::utf8(b"{current_state}"),
            string::utf8(b"{update_interval}"),
        ];
        
        let mut display = display::new_with_fields<DynamicNFT>(
            &publisher, keys, values, ctx
        );
        
        display::update_version(&mut display);
        transfer::public_transfer(display, tx_context::sender(ctx));
        transfer::public_transfer(publisher, tx_context::sender(ctx));
    }

    // ===== Entry Functions =====
    
    /// Create a new dynamic NFT that changes based on time
    public entry fun mint_nft(
        image_one: vector<u8>,
        image_two: vector<u8>,
        name: vector<u8>,
        description: vector<u8>,
        oracle: &TimeOracle,  // Get default interval from oracle
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let image_one_str = string::utf8(image_one);
        let image_two_str = string::utf8(image_two);
        
        let nft = DynamicNFT {
            id: object::new(ctx),
            current_state: 0,
            image_one: image_one_str,
            image_two: image_two_str,
            name: string::utf8(name),
            description: string::utf8(description),
            last_updated: clock::timestamp_ms(clock),
            current_image: image_one_str,
            update_interval: oracle.update_interval,  // Use default from oracle
            owner: tx_context::sender(ctx)
        };
        
        transfer::transfer(nft, tx_context::sender(ctx));
    }
    
    /// Update NFT state - can be called by anyone, but will only change state when enough time has passed for this specific NFT
    public entry fun update_nft_state(
        nft: &mut DynamicNFT,
        clock: &Clock,
        _ctx: &mut TxContext
    ) {
        let current_time = clock::timestamp_ms(clock);
        
        // Check if enough time has passed since this NFT's last update
        if (current_time >= nft.last_updated + (nft.update_interval * 1000)) {
            // Toggle the NFT state
            nft.current_state = if (nft.current_state == 0) { 1 } else { 0 };
            nft.last_updated = current_time;
            
            // Update the current_image field based on the new state
            nft.current_image = if (nft.current_state == 0) { nft.image_one } else { nft.image_two };
            
            // Emit event for the color change
            event::emit(ColorChangeEvent {
                nft_id: object::id_address(nft),
                new_state: nft.current_state,
                timestamp: current_time
            });
        } else {
            // Not enough time has passed
            abort EInvalidColorChangeTime
        }
    }
    
    /// Admin can change the default update interval for new NFTs
    public entry fun change_default_interval(
        _: &AdminCap,
        oracle: &mut TimeOracle,
        new_interval: u64,
        _ctx: &mut TxContext
    ) {
        oracle.update_interval = new_interval;
    }
    
    /// NFT owner can change their NFT's update interval
    public entry fun change_nft_interval(
        nft: &mut DynamicNFT,
        new_interval: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Only the owner can change the interval
        assert!(tx_context::sender(ctx) == nft.owner, ENotAuthorized);
        
        // Update the interval
        nft.update_interval = new_interval;
        
        // Emit event for the interval change
        event::emit(UpdateIntervalEvent {
            nft_id: object::id_address(nft),
            new_interval: new_interval,
            timestamp: clock::timestamp_ms(clock)
        });
    }
    
    // ===== View Functions =====
    
    /// Returns the current display image URL based on the NFT state
    public fun get_current_image(nft: &DynamicNFT): String {
        if (nft.current_state == 0) {
            nft.image_one
        } else {
            nft.image_two
        }
    }
    
    /// Check if the NFT is due for an update
    public fun is_update_due(nft: &DynamicNFT, clock: &Clock): bool {
        let current_time = clock::timestamp_ms(clock);
        current_time >= nft.last_updated + (nft.update_interval * 1000)
    }
    
    /// Get the update interval for an NFT
    public fun get_update_interval(nft: &DynamicNFT): u64 {
        nft.update_interval
    }
    
    /// Get the default update interval from the oracle
    public fun get_default_interval(oracle: &TimeOracle): u64 {
        oracle.update_interval
    }
}