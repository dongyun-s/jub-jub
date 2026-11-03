package io.github.dongyuns.jubjub.domain.shared.external.tmap;

public interface AddressGeocoder {

    GeocodingResult geocode(String address);
}
