import Map "mo:map/Map";
import { phash } "mo:map/Map";

module {
    // Helper function to check if caller is authorized
    public func isAuthorized(caller : Principal, authorizedCanisters : Map.Map<Principal, ()>) : Bool {
        return Map.has(authorizedCanisters, phash, caller);
    };
}