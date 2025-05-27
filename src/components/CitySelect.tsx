"use client";

import {
    createContext,
    useContext,
    useState,
    useRef,
    type ReactNode,
    useCallback,
} from "react";

import { fr } from "@codegouvfr/react-dsfr";
import { SearchBar } from "@codegouvfr/react-dsfr/SearchBar";
import Autocomplete from "@mui/material/Autocomplete";
import Popper from "@mui/material/Popper";
import _ from "lodash";
import { assert } from "tsafe/assert";
import { useStyles } from "tss-react/dsfr";

import { searchCommunes } from "@/lib/searchCommune";

interface InternationPlaceResult {
    label: string;
    country: string;
    lat: string;
    lon: string;
    place_id: number;
    isOSM: boolean;
}

interface FrancePlaceResult {
    value: string;
    label: string;
}

type SearchResult = InternationPlaceResult | FrancePlaceResult;

type SearchProps = {
    className?: string;
    overlayClassName?: string;
    onChange: (newValue: string) => void;
    onActive?: (active: boolean) => void;
    loading?: boolean;
    error?: boolean;
    defaultValue?: string;
    onSelect: (value: SearchResult) => void;
    results: SearchResult[];
};

export function Search(props: SearchProps) {
    const {
        className,
        overlayClassName,
        onChange,
        onSelect,
        onActive,
        loading,
        defaultValue,
        //error,
        results,
    } = props;

    const nativeInputProps = useContext(nativeInputPropsContext);
    const [value, setValue] = useState<string>("");
    const [selectedValue, setSelectedValue] = useState<string>(
        defaultValue || "",
    );
    const [isEditing, setIsEditing] = useState<boolean>(false);
    assert(
        nativeInputProps !== undefined,
        "nativeInputProps must be defined by providing a context",
    );

    const { css, cx } = useStyles();

    const getResult = (label: string) => {
        const result = results.find((result) => result.label === label);
        assert(result !== undefined);
        return result;
    };

    const [isOpen, setIsOpen] = useState(false);

    const valueRef = useRef(defaultValue);

    return (
        <Autocomplete
            // freeSolo
            PopperComponent={(props) => (
                <Popper
                    {...props}
                    style={{
                        ...props.style,
                        width: undefined,
                    }}
                    className={cx(
                        props.className,
                        css({
                            zIndex: 100000,
                            width: "40em",
                            [fr.breakpoints.down("lg")]: {
                                width: "calc(100vw - 3rem)",
                            },
                        }),
                        overlayClassName,
                    )}
                    placement="bottom-start"
                />
            )}
            loading={loading}
            className={className}
            fullWidth
            onInputChange={(...[, newValue]) => {
                valueRef.current = newValue;
                onChange(newValue);
                setValue(newValue);
            }}
            blurOnSelect
            onChange={(...[, id]) => {
                if (id === null) {
                    return;
                }
                onSelect(getResult(id));
                setSelectedValue(getResult(id).label);
            }}
            defaultValue={defaultValue}
            // value={null}
            options={results.map((result) => result.label)}
            filterOptions={(ids) => ids} // No filtering
            getOptionLabel={() => ""}
            renderOption={(liProps, id) => (
                <li {...liProps} id={id} key={id}>
                    {getResult(id).label}
                </li>
            )}
            noOptionsText={"Pas de résultat"}
            loadingText={"Chargement..."}
            onFocus={() => {
                onActive?.(true);
                setIsEditing(true);
            }}
            onBlur={() => {
                onActive?.(false);
                setIsEditing(false);
            }}
            handleHomeEndKeys
            isOptionEqualToValue={(option, value) => {
                return option === value;
            }}
            renderInput={(params) => (
                <div ref={params.InputProps.ref}>
                    <input
                        {...params.inputProps}
                        className={cx(
                            params.inputProps.className,
                            nativeInputProps.className,
                        )}
                        value={isEditing ? value : selectedValue}
                        // defaultValue={defaultValue}
                        id={nativeInputProps.id}
                        placeholder={nativeInputProps.placeholder}
                        type={nativeInputProps.type}
                    />
                </div>
            )}
            open={isOpen}
            onOpen={() => {
                const value = valueRef.current;

                if (value === "") {
                    return;
                }

                setIsOpen(true);
            }}
            onClose={() => setIsOpen(false)}
        />
    );
}

export type NativeInputProps = {
    className: string;
    id: string;
    placeholder: string;
    type: "search";
};

const nativeInputPropsContext = createContext<NativeInputProps | undefined>(
    undefined,
);

export function NativeInputPropsProvider(props: {
    children: ReactNode;
    nativeInputProps: NativeInputProps;
}) {
    const { nativeInputProps, children } = props;

    return (
        <nativeInputPropsContext.Provider value={nativeInputProps}>
            {children}
        </nativeInputPropsContext.Provider>
    );
}

export default function CitySelect({
    value,
    onChange,
    placeholder,
    defaultValue,
    state,
    stateRelatedMessage,
}: {
    value?: string;
    onChange: any;
    placeholder?: string;
    defaultValue: string;
    state?: string;
    stateRelatedMessage?: string;
}) {
    const loadOptions = async (
        inputValue: string,
        callback: (data: any) => void,
    ) => {
        const data = await searchForeignCity(inputValue);
        callback(data);
    };
    const [loading, setLoading] = useState<boolean>(false);
    const debounceLoadOptions = useCallback(_.debounce(loadOptions, 500), []);
    const [search, onSearchChange] = useState("");
    const [inputElement, setInputElement] = useState<HTMLInputElement | null>(
        null,
    );
    const [results, setResults] = useState<SearchResult[]>([]);

    return (
        <div className="fr-select-group">
            <label className="fr-label" htmlFor="city-select">
                Lieu de travail principal :
                <span className="fr-hint-text">
                    Cette information est utilisée pour faire une carte des
                    membres de la communauté
                </span>
            </label>
            <SearchBar
                id="city-select"
                label="Lieu de travail principal :"
                onButtonClick={function noRefCheck() {}}
                renderInput={({ className, id, placeholder, type }) => (
                    <NativeInputPropsProvider
                        nativeInputProps={{
                            className,
                            id,
                            placeholder,
                            type,
                        }}
                    >
                        <>
                            <Search
                                defaultValue={defaultValue}
                                // ref={setInputElement}
                                onChange={(value) => {
                                    setLoading(true);
                                    onSearchChange(value);
                                    debounceLoadOptions(value, (data) => {
                                        if (data) {
                                            setLoading(false);
                                            setResults(data);
                                        }
                                    });
                                }}
                                loading={loading}
                                onSelect={(value) => {
                                    onChange(value);
                                }}
                                // onKeyDown={(event) => {
                                //     if (event.key === "Escape") {
                                //         assert(inputElement !== null);
                                //         inputElement.blur();
                                //     }
                                // }}
                                overlayClassName="nx-w-full"
                                results={results}
                            />
                        </>
                    </NativeInputPropsProvider>
                )}
            />
        </div>
    );
}

interface OpenStreetMapCity {
    place_id: number;
    licence: string;
    osm_id: number;
    lat: string;
    lon: string;
    display_name: string;
    type: string;
    importance: number;
}

async function getCountry(value: string) {
    const search = value;

    const response = await fetch(
        `https://nominatim.openstreetmap.org/search?country=${search}&format=json`,
    );
    if (!response.ok) {
        return null;
    }
    const countries: OpenStreetMapCity[] = await response.json();

    const res = countries[0];
    const data = res
        ? {
              country_label: res.display_name,
              country_place_id: res.place_id,
              country_lat: res.lat,
              country_lon: res.lon,
          }
        : {};
    return data;
}

async function searchForeignCity(value: string) {
    if (!value) {
        return [];
    }
    const frenchCities = await searchCommunes(value);
    const search = value;
    const response = await fetch(
        `https://nominatim.openstreetmap.org/search?city=${search}&format=json&featuretype=city`,
    );
    if (!response.ok) {
        return [];
    }
    const cities: OpenStreetMapCity[] = await response.json();

    const res = cities.sort((a, b) => b.importance - a.importance);
    const data = res
        .map((d) => {
            const splitLabel = d.display_name.split(",").map((d) => d.trim());
            return {
                place_id: d.place_id,
                lat: d.lat,
                lon: d.lon,
                label: `${d.display_name}`,
                country: splitLabel[splitLabel.length - 1],
                isOSM: true,
            };
        })
        .filter((d) => d.country !== "France");
    return [...frenchCities, ...data].slice(0, 15);
}
