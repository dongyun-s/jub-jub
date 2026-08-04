package io.github.dongyuns.jubjub.domain.shared.external.tmap;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
record TmapGeocodingResponse(CoordinateInfo coordinateInfo) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    record CoordinateInfo(List<Coordinate> coordinate) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Coordinate(String lat, String lon, String newLat, String newLon) {
    }
}
