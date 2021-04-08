import { Widget } from "@phosphor/widgets";
import { injectable, multiInject } from "inversify";
import * as React from "react";
import { AbstractPropertiesViewPage } from "../properties-view-page";
import { PropertyDescriptor, PropertySource, PropertySourceFactory } from "./property-descriptor";
import { PropertyTable } from "./property-table";

/**
 * Base class for properties view page with a property table.
 */
@injectable()
export abstract class AbstractPropertyTablePage extends AbstractPropertiesViewPage {
    @multiInject(PropertySourceFactory)
    private readonly factories: PropertySourceFactory[];
    private propertySource: PropertySource | undefined;
    scrollY = false;

    onSelectionChange(source: Widget, selection: object): void {
        if (this.propertySource && this.propertySource.dispose)
            this.propertySource.dispose();

        if (selection) {
            this.propertySource = this.factories
                .find(p => p.support(selection))
                ?.getPropertySource(selection);
        }

        if (this.propertySource && this.propertySource.onPropertyChange)
            this.propertySource.onPropertyChange(() => this.onChangeEmitter.fire());
    }

    protected doRender(): React.ReactNode {
        if (this.propertySource) {
            const descriptors: PropertyDescriptor[] = this.propertySource.getPropertyDescriptors();
            const onApply = (descriptor: PropertyDescriptor, value: any) =>
                this.applyValue(descriptor, value);
            return (
                <PropertyTable
                    descriptors={descriptors}
                    onApply={onApply}
                />
            );
        } else return undefined;
    }

    private applyValue(descriptor: PropertyDescriptor, newValue: any) {
        this.propertySource?.setProperty(descriptor.name, newValue);
    }
}
